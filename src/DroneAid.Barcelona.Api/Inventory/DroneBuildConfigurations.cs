namespace DroneAid.Barcelona.Api.Inventory;

public sealed record DroneComponentRequirement(string ComponentName, decimal Quantity);

public sealed record DroneBuildConfiguration(
    string Id,
    string Name,
    string Description,
    IReadOnlyList<DroneComponentRequirement> Requirements);

public static class DroneBuildConfigurations
{
    public static readonly IReadOnlyList<DroneBuildConfiguration> All =
    [
        new DroneBuildConfiguration(
            "digital",
            "Digital drone",
            "Digital video system for a complete build.",
            [
                new("Frame", 1),
                new("Flight controller", 1),
                new("Motor", 4),
                new("Electronic speed controller", 4),
                new("Propeller", 4),
                new("Digital video unit", 1),
                new("Receiver", 1),
                new("Battery", 1),
                new("Antenna", 2),
                new("Fasteners", 1)
            ]),
        new DroneBuildConfiguration(
            "analog",
            "Analog drone",
            "Analog camera and transmitter for a complete build.",
            [
                new("Frame", 1),
                new("Flight controller", 1),
                new("Motor", 4),
                new("Electronic speed controller", 4),
                new("Propeller", 4),
                new("Analog camera", 1),
                new("Analog video transmitter", 1),
                new("Receiver", 1),
                new("Battery", 1),
                new("Antenna", 2),
                new("Fasteners", 1)
            ])
    ];

    public static DroneBuildConfiguration? Find(string configurationId) =>
        All.SingleOrDefault(item => string.Equals(item.Id, configurationId, StringComparison.OrdinalIgnoreCase));
}
