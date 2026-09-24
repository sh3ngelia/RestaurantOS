using FluentValidation;

namespace RestaurantOS.Application.Menu.Validators;

public class UpdateMenuCategoryRequestValidator : AbstractValidator<UpdateMenuCategoryRequest>
{
    public UpdateMenuCategoryRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Category name is required.")
            .MaximumLength(100);

        RuleFor(x => x.Description)
            .MaximumLength(500);

        RuleFor(x => x.DisplayOrder)
            .GreaterThanOrEqualTo(0);
    }
}