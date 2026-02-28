/*
 * ╔══════════════════════════════════════════════════╗
 * ║  RYLO — Emergency System Controller             ║
 * ║  Attach to: EmergencyManager GameObject          ║
 * ║  Coordinates ALL devices during emergency        ║
 * ╚══════════════════════════════════════════════════╝
 */
using UnityEngine;
using System.Collections;
using System.Collections.Generic;
using TMPro;
using UnityEngine.Rendering.Universal;

public class EmergencySystem : MonoBehaviour
{
    [Header("Device References")]
    public SmartDoorLock[] allLocks;
    public SmartLight[]    allLights;
    public SmartCamera[]   allCameras;
    public SmartAlarm[]    allAlarms;

    [Header("UI Overlay")]
    [Tooltip("Full-screen red overlay Canvas Group")]
    public CanvasGroup emergencyOverlay;
    public TextMeshProUGUI emergencyTypeLabel;
    public TextMeshProUGUI emergencyStatusLabel;
    public GameObject[] warningIcons;

    [Header("Lights / VFX")]
    public Light[] sceneLights;
    public Color panicColor    = new Color(1f, 0.1f, 0.1f);
    public Color intruderColor = new Color(1f, 0.5f, 0f);
    public Color fireColor     = new Color(1f, 0.3f, 0.0f);
    public Color medicalColor  = new Color(0.1f, 0.5f, 1f);

    [Header("Audio")]
    public AudioSource emergencyAudio;
    public AudioClip   panicClip;
    public AudioClip   intruderClip;
    public AudioClip   fireClip;
    public AudioClip   medicalClip;

    [Header("State")]
    [SerializeField] private bool emergencyActive;
    [SerializeField] private string currentType;

    private Coroutine _overlayCoroutine;
    private Coroutine _flashCoroutine;
    private Color[]   _originalLightColors;
    private float[]   _originalIntensities;

    void Start()
    {
        // Cache original light states
        if (sceneLights != null)
        {
            _originalLightColors  = new Color[sceneLights.Length];
            _originalIntensities  = new float[sceneLights.Length];
            for (int i = 0; i < sceneLights.Length; i++)
            {
                if (sceneLights[i] != null)
                {
                    _originalLightColors[i] = sceneLights[i].color;
                    _originalIntensities[i] = sceneLights[i].intensity;
                }
            }
        }
        if (emergencyOverlay != null) emergencyOverlay.alpha = 0f;
    }

    // ─────────────────────────────────────────────────────
    //  TRIGGER
    // ─────────────────────────────────────────────────────
    public void TriggerEmergency(string type)
    {
        emergencyActive = true;
        currentType = type;

        Debug.Log($"[Rylo] 🚨 EMERGENCY TRIGGERED — TYPE: {type}");

        Color accentColor = GetColorForType(type);

        // Lock all doors
        foreach (var d in allLocks)
            if (d != null) d.SetLocked(true);

        // Turn on all cameras with recording
        foreach (var c in allCameras)
            if (c != null) c.ApplyState(true, true);

        // Trigger all alarms
        foreach (var a in allAlarms)
            if (a != null) a.ApplyState(true, true);

        // Lights respond per emergency type
        ApplyEmergencyLighting(type, accentColor);

        // Overlay + audio
        PlayEmergencyAudio(type);
        UpdateOverlayUI(type, accentColor);

        if (_overlayCoroutine != null) StopCoroutine(_overlayCoroutine);
        if (_flashCoroutine != null)   StopCoroutine(_flashCoroutine);

        _overlayCoroutine = StartCoroutine(FadeOverlay(0.45f, 0.35f));
        _flashCoroutine   = StartCoroutine(FlashSceneLights(accentColor));
    }

    // ─────────────────────────────────────────────────────
    //  CANCEL
    // ─────────────────────────────────────────────────────
    public void CancelEmergency()
    {
        if (!emergencyActive) return;

        emergencyActive = false;
        Debug.Log("[Rylo] ✅ Emergency CANCELLED — Restoring home state");

        // Stop flashing
        if (_flashCoroutine != null)
        {
            StopCoroutine(_flashCoroutine);
            _flashCoroutine = null;
        }

        // Restore lights
        RestoreLighting();

        // Disarm alarms
        foreach (var a in allAlarms)
            if (a != null) a.ApplyState(false, false);

        // Keep cameras on (stay recording after emergency)
        foreach (var c in allCameras)
            if (c != null) c.ApplyState(true, false);

        // Keep doors locked (user un-locks manually)

        // Fade overlay out
        if (_overlayCoroutine != null) StopCoroutine(_overlayCoroutine);
        _overlayCoroutine = StartCoroutine(FadeOverlay(0f, 0.6f));

        if (emergencyAudio != null) emergencyAudio.Stop();
        if (emergencyTypeLabel != null)   emergencyTypeLabel.text = "";
        if (emergencyStatusLabel != null) emergencyStatusLabel.text = "Clear";
    }

    // ─────────────────────────────────────────────────────
    //  HELPERS
    // ─────────────────────────────────────────────────────
    Color GetColorForType(string type)
    {
        return type switch
        {
            "INTRUDER" => intruderColor,
            "FIRE"     => fireColor,
            "MEDICAL"  => medicalColor,
            _          => panicColor,   // PANIC + default
        };
    }

    void ApplyEmergencyLighting(string type, Color accent)
    {
        if (type == "FIRE")
        {
            // Keep lights on (needed for evacuation), tint orange
            foreach (var l in allLights)
                if (l != null) l.ApplyState(true, accent, 1.0f);
        }
        else if (type == "MEDICAL")
        {
            // Blue calm lighting
            foreach (var l in allLights)
                if (l != null) l.ApplyState(true, accent, 0.7f);
        }
        else
        {
            // PANIC / INTRUDER — flash via scene lights, smart lights dim red
            foreach (var l in allLights)
                if (l != null) l.ApplyState(true, accent, 0.3f);
        }
    }

    void RestoreLighting()
    {
        if (sceneLights == null) return;
        for (int i = 0; i < sceneLights.Length; i++)
        {
            if (sceneLights[i] == null) continue;
            StartCoroutine(LerpLight(sceneLights[i],
                sceneLights[i].color, _originalLightColors[i],
                sceneLights[i].intensity, _originalIntensities[i], 1.5f));
        }
    }

    IEnumerator LerpLight(Light lt, Color fromCol, Color toCol, float fromInt, float toInt, float dur)
    {
        float t = 0f;
        while (t < 1f)
        {
            t += Time.deltaTime / dur;
            lt.color = Color.Lerp(fromCol, toCol, t);
            lt.intensity = Mathf.Lerp(fromInt, toInt, t);
            yield return null;
        }
    }

    void PlayEmergencyAudio(string type)
    {
        if (emergencyAudio == null) return;
        AudioClip clip = type switch
        {
            "INTRUDER" => intruderClip,
            "FIRE"     => fireClip,
            "MEDICAL"  => medicalClip,
            _          => panicClip,
        };
        if (clip != null)
        {
            emergencyAudio.clip = clip;
            emergencyAudio.loop = true;
            emergencyAudio.Play();
        }
    }

    void UpdateOverlayUI(string type, Color accent)
    {
        if (emergencyTypeLabel != null)
        {
            emergencyTypeLabel.text = type switch
            {
                "PANIC"    => "⚠ PANIC ALERT",
                "INTRUDER" => "🔴 INTRUDER DETECTED",
                "FIRE"     => "🔥 FIRE EMERGENCY",
                "MEDICAL"  => "💙 MEDICAL EMERGENCY",
                _          => "⚠ EMERGENCY",
            };
            emergencyTypeLabel.color = accent;
        }
        if (emergencyStatusLabel != null)
        {
            emergencyStatusLabel.text = "All doors locked • Cameras recording • Hub notified";
            emergencyStatusLabel.color = Color.white;
        }
        foreach (var icon in warningIcons)
            if (icon != null) icon.SetActive(true);
    }

    IEnumerator FadeOverlay(float target, float duration)
    {
        if (emergencyOverlay == null) yield break;
        float start = emergencyOverlay.alpha;
        float t = 0f;
        while (t < 1f)
        {
            t += Time.deltaTime / duration;
            emergencyOverlay.alpha = Mathf.Lerp(start, target, t);
            yield return null;
        }
        emergencyOverlay.alpha = target;
    }

    IEnumerator FlashSceneLights(Color flashColor)
    {
        if (sceneLights == null) yield break;
        while (emergencyActive)
        {
            foreach (var l in sceneLights)
                if (l != null) { l.color = flashColor; l.intensity = 4f; }
            yield return new WaitForSeconds(0.5f);
            foreach (var l in sceneLights)
                if (l != null) { l.color = Color.black; l.intensity = 0f; }
            yield return new WaitForSeconds(0.5f);
        }
    }
}
