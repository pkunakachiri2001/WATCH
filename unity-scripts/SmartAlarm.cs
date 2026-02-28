/*
 * ╔══════════════════════════════════════════════╗
 * ║  RYLO — Smart Alarm Controller              ║
 * ║  Attach to: Alarm System GameObject          ║
 * ╚══════════════════════════════════════════════╝
 */
using UnityEngine;
using System.Collections;
using TMPro;

public class SmartAlarm : MonoBehaviour
{
    [Header("References")]
    public Light   sirenLight;
    public AudioSource sirenAudio;
    public AudioClip armSound;
    public AudioClip disarmSound;
    public AudioClip sirenClip;
    public TextMeshPro statusLabel;

    [Header("Siren Config")]
    public float sirenFlashRate = 0.25f;
    public Color sirenColorA = Color.red;
    public Color sirenColorB = Color.blue;

    [Header("Arm Indicator")]
    public Renderer panelRenderer;
    public Color armedColor   = new Color(1f, 0.3f, 0.1f);
    public Color disarmedColor = new Color(0.1f, 1f, 0.4f);

    [Header("State")]
    [SerializeField] private bool isArmed;
    [SerializeField] private bool isTriggered;

    private Coroutine _sirenCoroutine;
    private static readonly int EmissionColorID = Shader.PropertyToID("_EmissionColor");

    void Start()
    {
        ApplyState(false, false);
    }

    public void ApplyState(bool armed, bool triggered)
    {
        isArmed    = armed;
        isTriggered = triggered;

        if (triggered)
            StartSiren();
        else
            StopSiren();

        UpdateIndicator();

        if (!triggered && sirenAudio != null)
        {
            sirenAudio.Stop();
            sirenAudio.PlayOneShot(armed ? armSound : disarmSound);
        }

        Debug.Log($"[Rylo] Alarm → {(armed ? "ARMED" : "DISARMED")} | {(triggered ? "⚠️ TRIGGERED" : "Silent")}");
    }

    void StartSiren()
    {
        if (_sirenCoroutine != null) StopCoroutine(_sirenCoroutine);
        _sirenCoroutine = StartCoroutine(SirenCoroutine());

        if (sirenAudio != null && sirenClip != null)
        {
            sirenAudio.clip = sirenClip;
            sirenAudio.loop = true;
            sirenAudio.Play();
        }
    }

    void StopSiren()
    {
        if (_sirenCoroutine != null)
        {
            StopCoroutine(_sirenCoroutine);
            _sirenCoroutine = null;
        }
        if (sirenLight != null)
        {
            sirenLight.enabled = isArmed;
            sirenLight.color = armedColor;
            sirenLight.intensity = isArmed ? 0.3f : 0f;
        }
        if (sirenAudio != null) sirenAudio.Stop();
    }

    IEnumerator SirenCoroutine()
    {
        if (sirenLight == null) yield break;
        sirenLight.enabled = true;

        while (true)
        {
            sirenLight.color = sirenColorA;
            sirenLight.intensity = 8f;
            yield return new WaitForSeconds(sirenFlashRate);

            sirenLight.color = sirenColorB;
            sirenLight.intensity = 6f;
            yield return new WaitForSeconds(sirenFlashRate);
        }
    }

    void UpdateIndicator()
    {
        Color targetColor = isArmed ? armedColor : disarmedColor;

        if (panelRenderer != null)
        {
            panelRenderer.material.EnableKeyword("_EMISSION");
            panelRenderer.material.SetColor(EmissionColorID, targetColor * 0.8f);
        }

        if (statusLabel != null)
        {
            statusLabel.text = isTriggered ? "⚠ ALARM" : isArmed ? "ARMED" : "DISARMED";
            statusLabel.color = isTriggered ? Color.red : targetColor;
        }
    }
}
