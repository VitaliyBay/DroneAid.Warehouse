using System.ComponentModel.DataAnnotations;
using System.Reflection;
using DroneAid.Barcelona.Api.Contracts.Inventory;

namespace DroneAid.Barcelona.Api.IntegrationTests;

/// <summary>
/// Regression tests: decimal range limits such as "0.001" were parsed with the server's culture,
/// so on a host using a comma decimal separator (for example es-ES) every inventory write failed
/// with HTTP 500 while the invariant-culture Docker container worked.
/// </summary>
public sealed class CultureIndependenceTests
{
    [Fact]
    public void Every_decimal_range_in_the_request_contracts_is_parsed_in_the_invariant_culture()
    {
        var ranges = typeof(CreateComponentTypeRequest).Assembly.GetTypes()
            .Where(type => type.Namespace?.StartsWith("DroneAid.Barcelona.Api.Contracts") == true)
            .SelectMany(type => type.GetProperties())
            .SelectMany(property => property.GetCustomAttributes<RangeAttribute>().Select(range => (property, range)))
            .Where(item => item.range.OperandType == typeof(decimal))
            .ToList();

        Assert.NotEmpty(ranges);
        foreach (var (property, range) in ranges)
        {
            Assert.True(
                range.ParseLimitsInInvariantCulture && range.ConvertValueInInvariantCulture,
                $"{property.DeclaringType!.Name}.{property.Name} must parse its decimal range in the invariant culture.");
        }
    }
}
