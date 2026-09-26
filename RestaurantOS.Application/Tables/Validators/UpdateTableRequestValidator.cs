using FluentValidation;

namespace RestaurantOS.Application.Tables.Validators;

public class UpdateTableRequestValidator : AbstractValidator<UpdateTableRequest>
{
    public UpdateTableRequestValidator()
    {
        RuleFor(x => x.TableNumber)
            .InclusiveBetween(1, 999).WithMessage("Table number must be between 1 and 999.");

        RuleFor(x => x.Capacity)
            .InclusiveBetween(1, 30).WithMessage("Capacity must be between 1 and 30 guests.");
    }
}