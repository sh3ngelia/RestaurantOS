using RestaurantOS.Application.Common.Exceptions;
using RestaurantOS.Application.Common.Interfaces;

namespace RestaurantOS.Application.Authentication;

public class AuthService : IAuthService
{
    private const string InvalidCredentialsMessage = "Invalid email or password";

    private readonly IUserRepository _userRepository;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IJwtTokenGenerator _jwtTokenGenerator;

    public AuthService(
        IUserRepository userRepository,
        IPasswordHasher passwordHasher,
        IJwtTokenGenerator jwtTokenGenerator)
    {
        _userRepository = userRepository;
        _passwordHasher = passwordHasher;
        _jwtTokenGenerator = jwtTokenGenerator;
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
            throw new AuthenticationFailedException(InvalidCredentialsMessage);

        var user = await _userRepository.GetByEmailAsync(request.Email, cancellationToken);

        if (user is null || !_passwordHasher.Verify(request.Password, user.PasswordHash))
            throw new AuthenticationFailedException(InvalidCredentialsMessage);

        if (!user.IsActive)
            throw new AuthenticationFailedException("Account is deactivated");

        var token = _jwtTokenGenerator.GenerateToken(user);

        return new AuthResponse(token, user.FullName, user.Role.ToString());
    }
}