namespace DroneAid.Barcelona.Api.Inventory;

public sealed record DroneComponentRequirement(string ComponentName, decimal Quantity, string? Detail = null);

public sealed record DroneBuildConfiguration(
    string Id,
    string Name,
    string Description,
    IReadOnlyList<DroneComponentRequirement> Requirements);

/// <summary>
/// Standard parts for each drone type. Models and SKUs come from proforma invoice PI2026002821
/// (PARTIZAN SECURITY s.r.o.); see docs/features/drone-component-catalog.md.
/// </summary>
public static class DroneBuildConfigurations
{
    private static readonly DroneComponentRequirement[] SharedAirframe =
    [
        new("Frame", 1, "Pilotix PT10 V3 frame (SKU 5769)"),
        new("Flight controller", 1, "Pilotix F405 V3, from Stack DIY Kit (SKU 5201)"),
        new("Electronic speed controller", 1, "Pilotix 60A V1.0 4-in-1, from Stack DIY Kit (SKU 5201)"),
        new("Motor", 4, "Pilotix 3115 900KV with plastic pipes and plug (SKU 5193)"),
        new("Propeller", 4, "HQProp LR 3-Blade 10\" BiGlass Fibre Reinforced Nylon, 2 CCW + 2 CW (SKU LR10X5X3B-GRN/2)")
    ];

    private static readonly DroneComponentRequirement[] SharedEnd =
    [
        new("Battery", 1),
        new("Fasteners", 1)
    ];

    public static readonly IReadOnlyList<DroneBuildConfiguration> All =
    [
        new DroneBuildConfiguration(
            "digital",
            "Digital drone",
            "Walksnail Avatar digital video system for a complete build.",
            [
                .. SharedAirframe,
                new("Digital video unit", 1, "Walksnail Avatar GT Kit (FPV HD kit, VTX + camera; SKU WN12-2W14B)"),
                new("Receiver", 1, "Radiomaster BR4 Dual Band Xross Gemini ExpressLRS (SKU HP0157.0086)"),
                new("Antenna", 2, "Maple Wireless 4.85-6.3G 2dBi omnidirectional LHCP, SMA male (SKU 7995)"),
                .. SharedEnd
            ]),
        new DroneBuildConfiguration(
            "analog",
            "Analog drone",
            "Analog camera and transmitter for a complete build.",
            [
                .. SharedAirframe,
                new("Analog camera", 1, "Pilotix P6 Pro FPV camera (SKU 6577)"),
                new("Analog video transmitter", 1, "Pilotix VTX 4.9-6.2G 3.0W (SKU 5226)"),
                new("Receiver", 1, "Pilotix ELRS915 diversity with 2 antennas, PNP (SKU 5202)"),
                new("Antenna", 1, "Pilotix Lollipop 5.8G SMA RHCP 160mm (SKU 4236)"),
                new("MMCX to SMA adapter cable", 1, "Foxeer MMCX to SMA adapter cable (SKU 5199)"),
                new("VTX pigtail cable", 1, "Pilotix pigtail for VTX, 10cm (SKU 7559)"),
                .. SharedEnd
            ])
    ];

    public static DroneBuildConfiguration? Find(string configurationId) =>
        All.SingleOrDefault(item => string.Equals(item.Id, configurationId, StringComparison.OrdinalIgnoreCase));
}
