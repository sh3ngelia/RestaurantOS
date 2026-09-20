using RestaurantOS.Domain.Common;
using RestaurantOS.Domain.Enums;

namespace RestaurantOS.Domain.Entities;

public class User : BaseEntity
{
    public string FirstName { get; private set; }
    public string LastName { get; private set; }
    public string Email { get; private set; }
    public string PasswordHash { get; private set; }
    public UserRole Role { get; private set; }
    public bool IsActive { get; private set; }

    public User(string firstName, string lastName, string email, string passwordHash, UserRole role)
    {
        if (string.IsNullOrWhiteSpace(firstName))
            throw new DomainException("First name cannot be empty");
        if (string.IsNullOrWhiteSpace(lastName))
            throw new DomainException("Last name cannot be empty");
        if (string.IsNullOrWhiteSpace(email))
            throw new DomainException("Email cannot be empty");
        if(!email.Contains("@"))
            throw new DomainException("Email is not valid");
        if (string.IsNullOrWhiteSpace(passwordHash))
            throw new DomainException("Password hash cannot be empty");
        
        FirstName = firstName;
        LastName = lastName;
        Email = email;
        PasswordHash = passwordHash;
        Role = role;
        IsActive = true;
    }

    public string FullName => $"{FirstName} {LastName}";
    public void Deactivate()
    {
        if (!IsActive)
            throw new DomainException("User is already deactivated");
        IsActive = false;
        MarkAsUpdated();
    }

    public void Activate()
    {
        if (IsActive)
            throw new DomainException("User is already active");
        IsActive = true;
        MarkAsUpdated();
    }

    public void ChangeRole(UserRole newRole)
    {
        if (Role == newRole)
            throw new DomainException("User already has this role");
        Role = newRole;
        MarkAsUpdated();
    }

    public void ChangePassword(string newPasswordHash)
    {
        if (string.IsNullOrWhiteSpace(newPasswordHash))
            throw new DomainException("New password hash cannot be empty");
        if (newPasswordHash == PasswordHash)
            throw new DomainException("New password hash cannot be the same as the old one");
        PasswordHash = newPasswordHash;
        MarkAsUpdated();
    }

}
