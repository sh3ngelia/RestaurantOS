using FluentValidation;

namespace RestaurantOS.Application.Menu.Validators;

public class CreateMenuItemRequestValidator : AbstractValidator<CreateMenuItemRequest>
{
    public CreateMenuItemRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Item name is required.")
            .MaximumLength(150);

        RuleFor(x => x.Description)
            .MaximumLength(1000);

        RuleFor(x => x.Price)
            .GreaterThan(0).WithMessage("Price must be greater than zero.");
        
        RuleFor(x => x.CategoryId)
            .NotEmpty().WithMessage("Category ID is required.");
        
        RuleFor(x => x.PreparationStation)
            .IsInEnum().WithMessage("Invalid preparation station.");
        
        RuleFor(x => x.PreparationTimeInMinutes)
            .InclusiveBetween(1, 240).WithMessage("Preparation time must be between 1 and 240 minutes.");
    }
}
