using FluentValidation;

namespace RestaurantOS.Application.Stations.Validators;

public class CreateStationRequestValidator : AbstractValidator<CreateStationRequest>
{
    public CreateStationRequestValidator()
    {
        RuleFor(x => x.Name).NotEmpty().WithMessage("Station name is required.").MaximumLength(100);
        RuleFor(x => x.Type).IsInEnum().WithMessage("Invalid station type.");
        RuleFor(x => x.DisplayOrder).GreaterThanOrEqualTo(0);
    }
}