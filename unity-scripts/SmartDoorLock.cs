/*
 * ╔══════════════════════════════════════════════╗
 * ║  RYLO — Smart Door Lock Controller           ║
 * ║  Attach to: Each Door GameObject             ║
 * ╚══════════════════════════════════════════════╝
 *
 * SETUP:
 *   - Attach to a door GameObject
 *   - Assign doorAnimator (Animator with "IsLocked" bool parameter)
 *   - Assign lockIndicator (Point Light for visual feedback)
 *   - Assign lockedColor / unlockedColor
 *   - Set doorId to match (frontDoor | backDoor | garageDoor)
 */

using System.Collections;
using UnityEngine;

public class SmartDoorLock : MonoBehaviour
{
    [Header("Config")]
    public string doorId = "frontDoor";
    public bool startLocked = true;

    [Header("References")]
    [Tooltip("Animator with bool param 'IsLocked' and trigger 'Open','Close'")]
    public Animator doorAnimator;

    [Tooltip("Light that changes color to show lock status")]
    public Light lockIndicator;

    [Tooltip("Optional door handle / keypad mesh")]
    public Renderer lockRenderer;

    [Header("Sounds")]
    public AudioSource audioSource;
    public AudioClip lockSound;
    public AudioClip unlockSound;
    public AudioClip deniedSound;

    [Header("Colors")]
    public Color lockedColor   = new Color(1f, 0.2f, 0.1f);    // Red
    public Color unlockedColor = new Color(0.1f, 1f, 0.4f);    // Green
    public Color authColor     = new Color(0f, 0.8f, 1f);      // Cyan

    [Header("State")]
    [SerializeField] private bool isLocked;
    [SerializeField] private bool isAnimating;

    // Material refs
    private Material _lockMat;
    private static readonly int EmissionColorID  = Shader.PropertyToID("_EmissionColor");
    private static readonly int IsLockedParam     = Animator.StringToHash("IsLocked");
    private static readonly int OpenTrigger       = Animator.StringToHash("Open");
    private static readonly int CloseTrigger      = Animator.StringToHash("Close");

    void Start()
    {
        isLocked = startLocked;
        if (lockRenderer != null)
        {
            _lockMat = lockRenderer.material;
        }
        ApplyVisuals(isLocked, instant: true);
    }

    // ── Public API ──
    public void ApplyState(bool locked)
    {
        if (isAnimating) return;
        if (locked == isLocked) return;

        StartCoroutine(TransitionLock(locked));
    }

    // ── Transition ──
    IEnumerator TransitionLock(bool toLocked)
    {
        isAnimating = true;

        // Auth flash (cyan)
        SetIndicatorColor(authColor);

        if (audioSource != null)
        {
            audioSource.PlayOneShot(toLocked ? lockSound : unlockSound);
        }

        yield return new WaitForSeconds(0.4f);

        isLocked = toLocked;

        // Trigger animation
        if (doorAnimator != null)
        {
            doorAnimator.SetBool(IsLockedParam, isLocked);
            if (!isLocked)
                doorAnimator.SetTrigger(OpenTrigger);
            else
                doorAnimator.SetTrigger(CloseTrigger);
        }

        // Update visuals
        ApplyVisuals(isLocked, instant: false);

        yield return new WaitForSeconds(0.6f);
        isAnimating = false;

        Debug.Log($"[Rylo] {doorId} → {(isLocked ? "LOCKED" : "UNLOCKED")}");
    }

    // ── Visuals ──
    void ApplyVisuals(bool locked, bool instant)
    {
        var targetColor = locked ? lockedColor : unlockedColor;

        if (lockIndicator != null)
        {
            if (instant)
                lockIndicator.color = targetColor;
            else
                StartCoroutine(LerpLightColor(lockIndicator, lockIndicator.color, targetColor, 0.4f));
        }

        if (_lockMat != null)
        {
            _lockMat.EnableKeyword("_EMISSION");
            _lockMat.SetColor(EmissionColorID, targetColor * 0.8f);
        }
    }

    void SetIndicatorColor(Color c)
    {
        if (lockIndicator != null)
            lockIndicator.color = c;
    }

    IEnumerator LerpLightColor(Light light, Color from, Color to, float duration)
    {
        float t = 0f;
        while (t < duration)
        {
            t += Time.deltaTime;
            light.color = Color.Lerp(from, to, t / duration);
            yield return null;
        }
        light.color = to;
    }

    // Gizmo in editor
    void OnDrawGizmosSelected()
    {
        Gizmos.color = isLocked ? Color.red : Color.green;
        Gizmos.DrawWireCube(transform.position, Vector3.one * 0.3f);
    }
}
