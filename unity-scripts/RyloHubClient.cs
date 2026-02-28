/*
 * ╔══════════════════════════════════════════════════════╗
 * ║        RYLO HUB CLIENT — Unity WebSocket Bridge      ║
 * ║        Attach to: GameObject "RyloHubManager"        ║
 * ╚══════════════════════════════════════════════════════╝
 *
 * SETUP:
 *   1. Install NativeWebSocket from Package Manager:
 *      https://github.com/endel/NativeWebSocket
 *      (Add via Window → Package Manager → Add from git URL:
 *       https://github.com/endel/NativeWebSocket.git#upm)
 *
 *   2. Create an empty GameObject named "RyloHubManager"
 *   3. Attach this script to it
 *   4. Assign device references in Inspector
 */

using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using NativeWebSocket;
using System.Text;

// ──────────────────────────────
// Message Models
// ──────────────────────────────
[Serializable] public class RyloMessage    { public string type; public long timestamp; }
[Serializable] public class HomeCommand    { public string type; public string category; public string device; public string action; public int brightness; public string color; public float temperature; public string mode; public string fan; public bool recording; }
[Serializable] public class SceneCommand   { public string type; public string scene; }
[Serializable] public class EmergencyMsg   { public string type; public string emergencyType; public EmergencyActions actions; }
[Serializable] public class EmergencyActions { public bool lockAllDoors; public bool activateAllCameras; public bool activateAlarm; public bool turnOnAllLights; }
[Serializable] public class FullStateMsg   { public string type; public HomeState homeState; public bool emergency; }
[Serializable] public class DeviceState    { public bool locked; public bool on; public int brightness; public string color; public bool active; public bool recording; public bool armed; public bool triggered; public float temperature; public string fanMode; }

[Serializable]
public class HomeState
{
    public DeviceState frontDoor;
    public DeviceState backDoor;
    public DeviceState garageDoor;
    public DeviceState livingLight;
    public DeviceState bedroomLight;
    public DeviceState kitchenLight;
    public DeviceState outsideLight;
    public DeviceState thermostat;
    public DeviceState camera1;
    public DeviceState camera2;
    public DeviceState alarm;
}

// ──────────────────────────────
// Main Hub Client
// ──────────────────────────────
public class RyloHubClient : MonoBehaviour
{
    public static RyloHubClient Instance { get; private set; }

    [Header("Connection")]
    [Tooltip("Rylo Hub WebSocket URL")]
    public string hubUrl = "ws://localhost:8080";
    public float reconnectDelay = 3f;

    [Header("Device Controllers")]
    public SmartDoorLock frontDoorLock;
    public SmartDoorLock backDoorLock;
    public SmartDoorLock garageDoorLock;
    public SmartLight    livingRoomLight;
    public SmartLight    bedroomLight;
    public SmartLight    kitchenLight;
    public SmartLight    outsideLight;
    public SmartThermostat thermostat;
    public SmartCamera   frontCamera;
    public SmartCamera   backCamera;
    public SmartAlarm    alarm;
    public EmergencySystem emergencySystem;

    [Header("Status")]
    [SerializeField] private bool isConnected;
    [SerializeField] private string connectionStatus = "Disconnected";

    private WebSocket _ws;
    private bool _reconnecting;

    // Events
    public static event Action OnConnected;
    public static event Action OnDisconnected;
    public static event Action<HomeState> OnFullStateReceived;
    public static event Action OnEmergencyTriggered;
    public static event Action OnEmergencyCancelled;

    void Awake()
    {
        if (Instance != null && Instance != this) { Destroy(gameObject); return; }
        Instance = this;
        DontDestroyOnLoad(gameObject);
    }

    void Start()
    {
        StartCoroutine(ConnectToHub());
    }

    void Update()
    {
#if !UNITY_WEBGL || UNITY_EDITOR
        _ws?.DispatchMessageQueue();
#endif
    }

    // ── Connect ──
    IEnumerator ConnectToHub()
    {
        connectionStatus = "Connecting...";
        Debug.Log($"[Rylo] Connecting to hub: {hubUrl}");

        _ws = new WebSocket(hubUrl);

        _ws.OnOpen += () =>
        {
            isConnected = true;
            connectionStatus = "Connected";
            Debug.Log("[Rylo] ✓ Connected to Rylo Hub");

            // Register as Unity House
            SendMessage(new { type = "REGISTER_UNITY", device = "UNITY_HOUSE", version = "1.0.0" });
            OnConnected?.Invoke();
        };

        _ws.OnClose += (code) =>
        {
            isConnected = false;
            connectionStatus = $"Disconnected ({code})";
            Debug.LogWarning($"[Rylo] Disconnected: {code}");
            OnDisconnected?.Invoke();

            if (!_reconnecting)
                StartCoroutine(Reconnect());
        };

        _ws.OnError += (error) =>
        {
            Debug.LogError($"[Rylo] WebSocket error: {error}");
        };

        _ws.OnMessage += (data) =>
        {
            var json = Encoding.UTF8.GetString(data);
            HandleMessage(json);
        };

        yield return _ws.Connect();
    }

    IEnumerator Reconnect()
    {
        _reconnecting = true;
        connectionStatus = $"Reconnecting in {reconnectDelay}s...";
        Debug.Log($"[Rylo] Reconnecting in {reconnectDelay}s...");
        yield return new WaitForSeconds(reconnectDelay);
        _reconnecting = false;
        StartCoroutine(ConnectToHub());
    }

    // ── Message Dispatcher ──
    void HandleMessage(string json)
    {
        try
        {
            var base64 = JsonUtility.FromJson<RyloMessage>(json);

            switch (base64.type)
            {
                case "WELCOME":
                    Debug.Log("[Rylo] Hub welcomed Unity House");
                    break;

                case "HANDSHAKE_ACK":
                    Debug.Log("[Rylo] Handshake acknowledged by hub");
                    break;

                case "FULL_STATE_UPDATE":
                    HandleFullState(json);
                    break;

                case "HOME_COMMAND":
                    HandleHomeCommand(json);
                    break;

                case "SCENE_ACTIVATED":
                    HandleSceneActivated(json);
                    break;

                case "EMERGENCY":
                    HandleEmergency(json);
                    break;

                case "EMERGENCY_CANCEL":
                    HandleEmergencyCancel();
                    break;

                case "WATCH_CONNECTED":
                    Debug.Log("[Rylo] ✓ Rylo Watch connected to hub");
                    break;

                case "OWNER_HOME":
                    Debug.Log("[Rylo] Owner arrived home — auth verified");
                    break;

                case "HUB_SHUTDOWN":
                    Debug.LogWarning("[Rylo] Hub is shutting down");
                    break;

                default:
                    Debug.Log($"[Rylo] Unhandled: {base64.type}");
                    break;
            }
        }
        catch (Exception e)
        {
            Debug.LogError($"[Rylo] Failed to parse message: {e.Message}");
        }
    }

    // ── Handlers ──
    void HandleFullState(string json)
    {
        try
        {
            var msg = JsonUtility.FromJson<FullStateMsg>(json);
            if (msg.homeState == null) return;

            var s = msg.homeState;

            frontDoorLock?.ApplyState(s.frontDoor?.locked ?? true);
            backDoorLock?.ApplyState(s.backDoor?.locked ?? true);
            garageDoorLock?.ApplyState(s.garageDoor?.locked ?? true);

            livingRoomLight?.ApplyState(s.livingLight?.on ?? false, s.livingLight?.brightness ?? 100, s.livingLight?.color);
            bedroomLight?.ApplyState(s.bedroomLight?.on ?? false, s.bedroomLight?.brightness ?? 100, s.bedroomLight?.color);
            kitchenLight?.ApplyState(s.kitchenLight?.on ?? false, s.kitchenLight?.brightness ?? 100, s.kitchenLight?.color);
            outsideLight?.ApplyState(s.outsideLight?.on ?? false, s.outsideLight?.brightness ?? 100, s.outsideLight?.color);

            thermostat?.ApplyState(s.thermostat?.temperature ?? 22, s.thermostat?.mode, s.thermostat?.fanMode);

            frontCamera?.ApplyState(s.camera1?.active ?? false, s.camera1?.recording ?? false);
            backCamera?.ApplyState(s.camera2?.active ?? false, s.camera2?.recording ?? false);

            alarm?.ApplyState(s.alarm?.armed ?? false, s.alarm?.triggered ?? false);

            if (msg.emergency) emergencySystem?.TriggerEmergency("FULL_LOCKDOWN");

            OnFullStateReceived?.Invoke(msg.homeState);
        }
        catch (Exception e) { Debug.LogError($"[Rylo] HandleFullState error: {e.Message}"); }
    }

    void HandleHomeCommand(string json)
    {
        var cmd = JsonUtility.FromJson<HomeCommand>(json);
        Debug.Log($"[Rylo] Command: {cmd.category} → {cmd.device} → {cmd.action}");

        switch (cmd.category)
        {
            case "LOCK":
                GetLock(cmd.device)?.ApplyState(cmd.action == "LOCK");
                break;

            case "LIGHT":
                GetLight(cmd.device)?.ApplyState(cmd.action == "ON", cmd.brightness, cmd.color);
                break;

            case "THERMOSTAT":
                thermostat?.ApplyState(cmd.temperature, cmd.mode, cmd.fan);
                break;

            case "CAMERA":
                GetCamera(cmd.device)?.ApplyState(cmd.action == "ACTIVATE", cmd.recording);
                break;

            case "ALARM":
                alarm?.ApplyState(cmd.action == "ARM", false);
                break;

            case "POWER":
                if (cmd.action == "OFF") ShutdownAll();
                break;
        }
    }

    void HandleSceneActivated(string json)
    {
        var sceneCmd = JsonUtility.FromJson<HomeCommand>(json);
        HandleFullState(json); // Full state is sent with scene
    }

    void HandleEmergency(string json)
    {
        var msg = JsonUtility.FromJson<EmergencyMsg>(json);
        Debug.LogWarning($"[Rylo] 🚨 EMERGENCY: {msg.emergencyType}");

        emergencySystem?.TriggerEmergency(msg.emergencyType);
        OnEmergencyTriggered?.Invoke();
    }

    void HandleEmergencyCancel()
    {
        Debug.Log("[Rylo] Emergency cancelled");
        emergencySystem?.CancelEmergency();
        OnEmergencyCancelled?.Invoke();
    }

    // ── Send ──
    public void SendMessage(object data)
    {
        if (_ws == null || _ws.State != WebSocketState.Open)
        {
            Debug.LogWarning("[Rylo] Cannot send — not connected");
            return;
        }
        string json = JsonUtility.ToJson(data);
        _ws.SendText(json);
    }

    // ── Helpers ──
    void ShutdownAll()
    {
        livingRoomLight?.ApplyState(false, 0, null);
        bedroomLight?.ApplyState(false, 0, null);
        kitchenLight?.ApplyState(false, 0, null);
        outsideLight?.ApplyState(false, 0, null);
    }

    SmartDoorLock GetLock(string id) => id switch
    {
        "frontDoor"  => frontDoorLock,
        "backDoor"   => backDoorLock,
        "garageDoor" => garageDoorLock,
        _ => null
    };

    SmartLight GetLight(string id) => id switch
    {
        "livingLight"  => livingRoomLight,
        "bedroomLight" => bedroomLight,
        "kitchenLight" => kitchenLight,
        "outsideLight" => outsideLight,
        _ => null
    };

    SmartCamera GetCamera(string id) => id switch
    {
        "camera1" => frontCamera,
        "camera2" => backCamera,
        _ => null
    };

    void OnDestroy()
    {
        _ws?.Close();
    }

    void OnApplicationQuit()
    {
        _ws?.Close();
    }
}
