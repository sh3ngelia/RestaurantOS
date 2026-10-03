using FluentValidation;
using RestaurantOS.Application.Common.Exceptions;
using RestaurantOS.Application.Common.Interfaces;
using RestaurantOS.Domain.Entities;
using RestaurantOS.Domain.Enums;

namespace RestaurantOS.Application.Staff;

public class StaffService : IStaffService
{
    private readonly IUserRepository _userRepository;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUser;
    private readonly IValidator<CreateStaffRequest> _createValidator;
    private readonly IValidator<UpdateStaffProfileRequest> _profileValidator;
    private readonly IValidator<ChangeRoleRequest> _roleValidator;
    private readonly IValidator<ResetPasswordRequest> _passwordValidator;

    public StaffService(
        IUserRepository userRepository,
        IPasswordHasher passwordHasher,
        IUnitOfWork unitOfWork,
        ICurrentUserService currentUser,
        IValidator<CreateStaffRequest> createValidator,
        IValidator<UpdateStaffProfileRequest> profileValidator,
        IValidator<ChangeRoleRequest> roleValidator,
        IValidator<ResetPasswordRequest> passwordValidator)
    {
        _userRepository = userRepository;
        _passwordHasher = passwordHasher;
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
        _createValidator = createValidator;
        _profileValidator = profileValidator;
        _roleValidator = roleValidator;
        _passwordValidator = passwordValidator;
    }

    public async Task<IReadOnlyList<StaffResponse>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        var users = await _userRepository.GetAllAsync(cancellationToken);
        return users.Select(u => u.ToStaffResponse()).ToList();
    }

    public async Task<StaffResponse> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        (await GetUserOrThrowAsync(id, cancellationToken)).ToStaffResponse();

    public async Task<StaffResponse> CreateAsync(CreateStaffRequest request, CancellationToken cancellationToken = default)
    {
        await _createValidator.ValidateAndThrowAsync(request, cancellationToken);

        if (await _userRepository.ExistsByEmailAsync(request.Email, cancellationToken: cancellationToken))
            throw new ConflictException($"A staff member with email '{request.Email.Trim()}' already exists.");

        var user = new User(
            request.FirstName.Trim(),
            request.LastName.Trim(),
            request.Email,
            _passwordHasher.Hash(request.Password),
            request.Role);

        _userRepository.Add(user);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return user.ToStaffResponse();
    }

    public async Task<StaffResponse> UpdateProfileAsync(Guid id, UpdateStaffProfileRequest request, CancellationToken cancellationToken = default)
    {
        await _profileValidator.ValidateAndThrowAsync(request, cancellationToken);

        var user = await GetUserOrThrowAsync(id, cancellationToken);

        if (await _userRepository.ExistsByEmailAsync(request.Email, id, cancellationToken))
            throw new ConflictException($"A staff member with email '{request.Email.Trim()}' already exists.");

        user.UpdateProfile(request.FirstName, request.LastName, request.Email);

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return user.ToStaffResponse();
    }

    public async Task<StaffResponse> ChangeRoleAsync(Guid id, ChangeRoleRequest request, CancellationToken cancellationToken = default)
    {
        await _roleValidator.ValidateAndThrowAsync(request, cancellationToken);

        var user = await GetUserOrThrowAsync(id, cancellationToken);
        EnsureNotSelf(user, "change your own role");

        if (user.Role == UserRole.Manager && request.Role != UserRole.Manager)
            await EnsureNotLastActiveManagerAsync(user, cancellationToken);

        user.ChangeRole(request.Role);

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return user.ToStaffResponse();
    }

    public async Task<StaffResponse> DeactivateAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var user = await GetUserOrThrowAsync(id, cancellationToken);
        EnsureNotSelf(user, "deactivate your own account");

        if (user.Role == UserRole.Manager)
            await EnsureNotLastActiveManagerAsync(user, cancellationToken);

        user.Deactivate();

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return user.ToStaffResponse();
    }

    public async Task<StaffResponse> ActivateAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var user = await GetUserOrThrowAsync(id, cancellationToken);
        user.Activate();

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return user.ToStaffResponse();
    }

    public async Task ResetPasswordAsync(Guid id, ResetPasswordRequest request, CancellationToken cancellationToken = default)
    {
        await _passwordValidator.ValidateAndThrowAsync(request, cancellationToken);

        var user = await GetUserOrThrowAsync(id, cancellationToken);
        user.ChangePassword(_passwordHasher.Hash(request.NewPassword));

        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    private async Task<User> GetUserOrThrowAsync(Guid id, CancellationToken cancellationToken) =>
        await _userRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new NotFoundException("Staff member", id);

    private void EnsureNotSelf(User user, string action)
    {
        if (user.Id == _currentUser.UserId)
            throw new ConflictException($"You cannot {action}.");
    }

    private async Task EnsureNotLastActiveManagerAsync(User user, CancellationToken cancellationToken)
    {
        if (!user.IsActive)
            return;

        var activeManagers = await _userRepository.CountActiveByRoleAsync(UserRole.Manager, cancellationToken);
        if (activeManagers <= 1)
            throw new ConflictException("The restaurant must always have at least one active manager.");
    }
}