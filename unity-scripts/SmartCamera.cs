/*
 * ╔══════════════════════════════════════════════╗
 * ║  RYLO — Smart Camera Controller             ║
 * ║  Attach to: Camera Prop GameObject           ║
 * ╚══════════════════════════════════════════════╝
 */
using UnityEngine;
using TMPro;
using System.Collections;

public class SmartCamera : MonoBehaviour
{
    [Header("Config")]
    public string cameraId = "camera1";

    [Header("References")]
    public Camera renderCamera;
    public Light   statusLight;
    public Animator panAnimator;
    public TextMeshPro recordingLabel;

    [Header("Scan")]
    public Transform scanPivot;
    public float scanAngle = 60f;
    public float scanSpeed = 15f;

    [Header("Colors")]
    public Color activeColor   = new Color(0f, 1f, 0.4f);
    public Color recordingColor = Color.red;
    public Color offColor      = new Color(0.2f, 0.2f, 0.2f);

    [Header("State")]
    [SerializeField] private bool isActive;
    [SerializeField] private bool isRecording;

    private Coroutine _scanRoutine;
    private bool _scanning;

    void Start()
    {
        ApplyState(false, false);
    }

    public void ApplyState(bool active, bool recording)
    {
        isActive    = active;
        isRecording = recording;

        if (renderCamera != null) renderCamera.enabled = active;

        if (statusLight != null)
            statusLight.color = recording ? recordingColor : active ? activeColor : offColor;

        if (recordingLabel != null)
        {
            recordingLabel.gameObject.SetActive(active);
            recordingLabel.text = recording ? "● REC" : "● LIVE";
            recordingLabel.color = recording ? recordingColor : activeColor;
        }

        if (active && !_scanning)
        {
            _scanRoutine = StartCoroutine(ScanRoutine());
            _scanning = true;
        }
        else if (!active && _scanning)
        {
            if (_scanRoutine != null) StopCoroutine(_scanRoutine);
            _scanning = false;
            if (scanPivot != null)
                scanPivot.localRotation = Quaternion.identity;
        }

        Debug.Log($"[Rylo] {cameraId} → {(active ? (recording ? "RECORDING" : "LIVE") : "OFF")}");
    }

    IEnumerator ScanRoutine()
    {
        if (scanPivot == null) yield break;

        while (true)
        {
            // Sweep left
            float target = -scanAngle / 2f;
            while (Quaternion.Angle(scanPivot.localRotation, Quaternion.Euler(0, target, 0)) > 0.5f)
            {
                scanPivot.localRotation = Quaternion.RotateTowards(
                    scanPivot.localRotation,
                    Quaternion.Euler(0, target, 0),
                    scanSpeed * Time.deltaTime
                );
                yield return null;
            }

            yield return new WaitForSeconds(0.5f);

            // Sweep right
            target = scanAngle / 2f;
            while (Quaternion.Angle(scanPivot.localRotation, Quaternion.Euler(0, target, 0)) > 0.5f)
            {
                scanPivot.localRotation = Quaternion.RotateTowards(
                    scanPivot.localRotation,
                    Quaternion.Euler(0, target, 0),
                    scanSpeed * Time.deltaTime
                );
                yield return null;
            }

            yield return new WaitForSeconds(0.5f);
        }
    }
}
