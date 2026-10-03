using Microsoft.EntityFrameworkCore;
using RestaurantOS.Application.Common.Interfaces;
using RestaurantOS.Domain.Entities;
using RestaurantOS.Domain.Enums;


namespace RestaurantOS.Infrastructure.Persistence.Repositories;

public class UserRepository : IUserRepository
{
    private readonly RestaurantDbContext _dbContext;
    public UserRepository(RestaurantDbContext dbContext)
    {
        _dbContext = dbContext;
    }
    public async Task<User?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _dbContext.Users.FindAsync(new object[] { id }, cancellationToken);
    }
    public async Task<User?> GetByEmailAsync(string email, CancellationToken cancellationToken = default)
    {
        var normalizedEmail = email.Trim().ToLowerInvariant();
        return await _dbContext.Users.FirstOrDefaultAsync(u => u.Email == normalizedEmail, cancellationToken);
    }
    public async Task<bool> ExistsByEmailAsync(string email, Guid? excludeId = null, CancellationToken cancellationToken = default)
    {
        var normalizedEmail = email.Trim().ToLowerInvariant();
        return await _dbContext.Users.AnyAsync(u => u.Email == normalizedEmail && u.Id != excludeId, cancellationToken);
    }

    public async Task<IReadOnlyList<User>> GetAllAsync(CancellationToken cancellationToken = default) =>
        await _dbContext.Users
            .AsNoTracking()
            .OrderBy(u => u.Role)
            .ThenBy(u => u.FirstName)
            .ToListAsync(cancellationToken);

    public async Task<int> CountActiveByRoleAsync(UserRole role, CancellationToken cancellationToken = default) =>
        await _dbContext.Users.CountAsync(u => u.Role == role && u.IsActive, cancellationToken);
    public void Add(User user)
    {
        _dbContext.Users.Add(user);
    }
}
