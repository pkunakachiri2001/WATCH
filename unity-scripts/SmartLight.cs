/*
 * ╔══════════════════════════════════════════════╗
 * ║  RYLO — Smart Light Controller               ║
 * ║  Attach to: Each Light Source GameObject     ║
 * ╚══════════════════════════════════════════════╝
 *
 * SETUP:
 *   - Attach to a GameObject containing lights
 *   - Assign lightSource (the main Unity Light)
 *   - Assign emissiveMeshes (meshes with emissive material)
 *   - Set lightId matching the Rylo system ID
 */

using System;
using System.Collections;
using UnityEngine;

public class SmartLight : MonoBehaviour
{
    [Header("Config")]
    public string lightId = "livingLight";
    public bool startOn = false;
    public float maxIntensity = 2.5f;

    [Header("References")]
    public Light lightSource;
    public Renderer[] emissiveMeshes;
    public ParticleSystem ambientParticles;

    [Header("Transition")]
    public float fadeTime = 0.5f;

    [Header("State")]
    [SerializeField] private bool isOn;
    [SerializeField] private int brightness = 100;
    [SerializeField] private Color lightColor = Color.white;

    private Coroutine _fadeCoroutine;
    private Material[] _emissiveMats;
    private static readonly int EmissionColorID = Shader.PropertyToID("_EmissionColor");
    private static readonly int BaseColorID     = Shader.PropertyToID("_BaseColor");

    void Start()
    {
        // Cache materials
        if (emissiveMeshes != null && emissiveMeshes.Length > 0)
        {
            _emissiveMats = new Material[emissiveMeshes.Length];
            for (int i = 0; i < emissiveMeshes.Length; i++)
                _emissiveMats[i] = emissiveMeshes[i].material;
        }

        isOn = startOn;
        ApplyInstant(isOn, brightness, lightColor);
    }

    // ── Public API ──
    public void ApplyState(bool on, int brt, string hexColor)
    {
        Color col = lightColor;
        if (!string.IsNullOrEmpty(hexColor))
            ColorUtility.TryParseHtmlString(hexColor, out col);

        if (_fadeCoroutine != null) StopCoroutine(_fadeCoroutine);
        _fadeCoroutine = StartCoroutine(FadeToState(on, brt, col));
    }

    // ── Fade Coroutine ──
    IEnumerator FadeToState(bool on, int targetBrt, Color targetColor)
    {
        float startIntensity = lightSource != null ? lightSource.intensity : 0;
        float targetIntensity = on ? (maxIntensity * targetBrt / 100f) : 0f;

        Color startColor = lightSource != null ? lightSource.color : lightColor;

        float t = 0;
        while (t < fadeTime)
        {
            t += Time.deltaTime;
            float progress = t / fadeTime;

            float newIntensity = Mathf.Lerp(startIntensity, targetIntensity, progress);
            Color newColor = Color.Lerp(startColor, targetColor, progress);

            ApplyToComponents(newIntensity, newColor);
            yield return null;
        }

        ApplyToComponents(targetIntensity, targetColor);

        isOn = on;
        brightness = targetBrt;
        lightColor = targetColor;

        // Toggle particles
        if (ambientParticles != null)
        {
            if (on) ambientParticles.Play();
            else ambientParticles.Stop();
        }

        Debug.Log($"[Rylo] {lightId} → {(on ? $"ON {targetBrt}%" : "OFF")} | Color: {ColorUtility.ToHtmlStringRGB(targetColor)}");
    }

    void ApplyInstant(bool on, int brt, Color col)
    {
        float intensity = on ? (maxIntensity * brt / 100f) : 0f;
        ApplyToComponents(intensity, col);
        isOn = on;
        brightness = brt;
        lightColor = col;
    }

    void ApplyToComponents(float intensity, Color col)
    {
        if (lightSource != null)
        {
            lightSource.enabled = intensity > 0.001f;
            lightSource.intensity = intensity;
            lightSource.color = col;
        }

        if (_emissiveMats != null)
        {
            foreach (var mat in _emissiveMats)
            {
                if (mat == null) continue;
                mat.EnableKeyword("_EMISSION");
                float emMultiplier = intensity / maxIntensity;
                mat.SetColor(EmissionColorID, col * emMultiplier * 1.5f);
                mat.SetColor(BaseColorID, col);
            }
        }
    }

    void OnDrawGizmosSelected()
    {
        Gizmos.color = isOn ? Color.yellow : Color.gray;
        Gizmos.DrawIcon(transform.position, "Light Gizmo", true);
    }
}
