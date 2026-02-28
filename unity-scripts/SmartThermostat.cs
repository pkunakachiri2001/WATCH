/*
 * ╔══════════════════════════════════════════════╗
 * ║  RYLO — Smart Thermostat Controller          ║
 * ║  Attach to: Thermostat GameObject            ║
 * ╚══════════════════════════════════════════════╝
 */
using UnityEngine;
using TMPro;
using System.Collections;

public class SmartThermostat : MonoBehaviour
{
    [Header("UI References")]
    public TextMeshPro temperatureDisplay;
    public TextMeshPro modeDisplay;
    public TextMeshPro fanDisplay;

    [Header("Visual Effects")]
    public ParticleSystem coldParticles;
    public ParticleSystem heatParticles;
    public Light accentLight;

    [Header("State")]
    [SerializeField] private float temperature = 22f;
    [SerializeField] private string mode = "cool";
    [SerializeField] private string fanSpeed = "auto";

    // Colors for modes
    private static readonly Color CoolColor   = new Color(0f, 0.8f, 1f);
    private static readonly Color HeatColor   = new Color(1f, 0.4f, 0.1f);
    private static readonly Color AutoColor   = new Color(0.4f, 1f, 0.4f);
    private static readonly Color FanColor    = new Color(0.8f, 0.8f, 1f);

    void Start()
    {
        UpdateDisplays();
    }

    public void ApplyState(float temp, string newMode, string newFan)
    {
        float oldTemp = temperature;
        temperature = temp;
        mode = newMode ?? mode;
        fanSpeed = newFan ?? fanSpeed;

        StartCoroutine(AnimateTemperatureChange(oldTemp, temp));
        UpdateDisplays();
        UpdateVisuals();

        Debug.Log($"[Rylo] Thermostat → {temp}°C | Mode: {mode} | Fan: {fanSpeed}");
    }

    IEnumerator AnimateTemperatureChange(float from, float to)
    {
        float t = 0;
        float duration = 1.5f;
        while (t < duration)
        {
            t += Time.deltaTime;
            float current = Mathf.Lerp(from, to, t / duration);
            if (temperatureDisplay != null)
                temperatureDisplay.text = $"{current:F1}°";
            yield return null;
        }
    }

    void UpdateDisplays()
    {
        if (temperatureDisplay != null)
            temperatureDisplay.text = $"{temperature:F1}°";

        if (modeDisplay != null)
            modeDisplay.text = mode.ToUpper();

        if (fanDisplay != null)
            fanDisplay.text = $"FAN: {fanSpeed.ToUpper()}";
    }

    void UpdateVisuals()
    {
        // Stop all particles
        coldParticles?.Stop();
        heatParticles?.Stop();

        Color modeColor = mode switch
        {
            "cool" => CoolColor,
            "heat" => HeatColor,
            "auto" => AutoColor,
            "fan"  => FanColor,
            _ => AutoColor
        };

        if (accentLight != null)
            accentLight.color = modeColor;

        switch (mode)
        {
            case "cool":
                coldParticles?.Play();
                break;
            case "heat":
                heatParticles?.Play();
                break;
        }
    }
}
