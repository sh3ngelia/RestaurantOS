using RestaurantOS.Domain.Common;

namespace RestaurantOS.Domain.Entities;

public class Customer : BaseEntity
{
    public string FirstName { get; private set; }
    public string LastName { get; private set; }
    public string Email { get; private set; }
    public string PhoneNumber { get; private set; }
    public string PasswordHash { get; private set; }
    public bool IsActive { get; private set; }

    private Customer() { }
    public Customer(string firstName, string lastName, string email, string phoneNumber, string passwordHash)
    {
        if (string.IsNullOrWhiteSpace(firstName))
            throw new DomainException("First name cannot be empty");
        if (string.IsNullOrWhiteSpace(lastName))
            throw new DomainException("Last name cannot be empty");
        ValidateEmail(email);
        ValidatePhoneNumber(phoneNumber); 
        if (string.IsNullOrWhiteSpace(passwordHash))
            throw new DomainException("Password hash cannot be empty");
        FirstName = firstName;
        LastName = lastName;
        Email = email.Trim().ToLowerInvariant();
        PhoneNumber = phoneNumber;
        PasswordHash = passwordHash;
        IsActive = true;
    }

    public string FullName => $"{FirstName} {LastName}";
    
    public void UpdateContactInfo(string email, string phoneNumber)
    {
        ValidateEmail(email);
        ValidatePhoneNumber(phoneNumber);
        Email = email.Trim().ToLowerInvariant();
        PhoneNumber = phoneNumber;
        MarkAsUpdated();
    }

    public void ChangePassword(string newPasswordHash)
    {
        if (string.IsNullOrWhiteSpace(newPasswordHash))
            throw new DomainException("Password hash cannot be empty");
        PasswordHash = newPasswordHash;
        MarkAsUpdated();
    }

    public void Deactivate()
    {
        if (!IsActive)
            throw new DomainException("Customer is already deactivated");
        IsActive = false;
        MarkAsUpdated();
    }

    public void Activate()
    {
        if (IsActive)
            throw new DomainException("Customer is already active");
        IsActive = true;
        MarkAsUpdated();
    }  
    
    private static void ValidatePhoneNumber(string phoneNumber)
    {
        if (string.IsNullOrWhiteSpace(phoneNumber))
            throw new DomainException("Phone number cannot be empty");
        if (phoneNumber.Length < 9)
            throw new DomainException("Phone number must be at least 9 digits");
    }

    private static void ValidateEmail(string email)
    {
        if (string.IsNullOrWhiteSpace(email))
            throw new DomainException("Email cannot be empty");
        if (!email.Contains("@"))
            throw new DomainException("Email is not valid");
    }
}
