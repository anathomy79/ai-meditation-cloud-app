import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

const elements = {
  firebaseConfig: document.getElementById("firebase-config"),
  apiBaseUrl: document.getElementById("api-base-url"),
  saveConfig: document.getElementById("save-config"),
  configStatus: document.getElementById("config-status"),
  authEmail: document.getElementById("auth-email"),
  authPassword: document.getElementById("auth-password"),
  signIn: document.getElementById("sign-in"),
  signUp: document.getElementById("sign-up"),
  signInAnon: document.getElementById("sign-in-anon"),
  signOut: document.getElementById("sign-out"),
  authStatus: document.getElementById("auth-status"),
  sessionGoal: document.getElementById("session-goal"),
  sessionMood: document.getElementById("session-mood"),
  startSession: document.getElementById("start-session"),
  sessionTranscript: document.getElementById("session-transcript"),
  sessionAudio: document.getElementById("session-audio"),
  chatLog: document.getElementById("chat-log"),
  chatInput: document.getElementById("chat-input"),
  chatSend: document.getElementById("chat-send"),
  moodLabel: document.getElementById("mood-label"),
  moodNotes: document.getElementById("mood-notes"),
  saveMood: document.getElementById("save-mood"),
  moodList: document.getElementById("mood-list"),
  safetyBanner: document.getElementById("safety-banner"),
  safetyMessage: document.getElementById("safety-message"),
};

const state = {
  auth: null,
  currentUser: null,
  apiBaseUrl: "",
  moods: [],
  chatMessages: [],
};

const storageKeys = {
  firebaseConfig: "firebaseConfig",
  apiBaseUrl: "apiBaseUrl",
};

const setStatus = (element, message, isError = false) => {
  element.textContent = message;
  element.classList.toggle("error", isError);
};

const loadStoredConfig = () => {
  const rawConfig = localStorage.getItem(storageKeys.firebaseConfig);
  const apiBaseUrl = localStorage.getItem(storageKeys.apiBaseUrl) || "";
  return {
    firebaseConfig: rawConfig ? JSON.parse(rawConfig) : null,
    apiBaseUrl,
  };
};

const saveConfig = () => {
  try {
    const config = JSON.parse(elements.firebaseConfig.value.trim());
    localStorage.setItem(storageKeys.firebaseConfig, JSON.stringify(config));
    localStorage.setItem(storageKeys.apiBaseUrl, elements.apiBaseUrl.value.trim());
    setStatus(elements.configStatus, "Konfiguration gespeichert. Seite neu laden.");
  } catch (error) {
    setStatus(elements.configStatus, "Ungültiges JSON in der Firebase-Konfiguration.", true);
  }
};

const initFirebase = (config) => {
  if (!config) {
    setStatus(elements.configStatus, "Keine Firebase-Konfiguration gespeichert.");
    return;
  }

  if (!getApps().length) {
    initializeApp(config);
  }

  state.auth = getAuth();
  onAuthStateChanged(state.auth, (user) => {
    state.currentUser = user;
    if (user) {
      setStatus(elements.authStatus, `Angemeldet als ${user.email ?? user.uid}`);
    } else {
      setStatus(elements.authStatus, "Nicht angemeldet.");
    }
  });
};

const requireAuth = () => {
  if (!state.currentUser) {
    alert("Bitte zuerst anmelden.");
    return false;
  }
  return true;
};

const getIdToken = async () => {
  if (!state.currentUser) {
    return null;
  }
  return state.currentUser.getIdToken();
};

const callApi = async (path, payload) => {
  if (!state.apiBaseUrl) {
    throw new Error("API Base-URL fehlt.");
  }
  const token = await getIdToken();
  const response = await fetch(`${state.apiBaseUrl}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || data.message || "API Fehler");
  }
  return data;
};

const showSafety = (safety) => {
  if (!safety || safety.verdict === "SAFE") {
    elements.safetyBanner.classList.add("hidden");
    elements.safetyMessage.textContent = "";
    return;
  }

  elements.safetyBanner.classList.remove("hidden");
  elements.safetyMessage.textContent = safety.message || "Es wurde ein sensibles Thema erkannt.";
};

const renderChat = () => {
  elements.chatLog.innerHTML = "";
  state.chatMessages.forEach((message) => {
    const bubble = document.createElement("div");
    bubble.className = `chat-bubble ${message.role}`;
    bubble.textContent = message.content;
    elements.chatLog.appendChild(bubble);
  });
};

const renderMoods = () => {
  elements.moodList.innerHTML = "";
  state.moods.forEach((mood) => {
    const item = document.createElement("li");
    item.className = "mood-item";
    item.innerHTML = `
      <strong>${mood.label}</strong>
      <span class="muted">${mood.notes ?? "Keine Notizen"}</span>
      <span class="muted">${new Date(mood.createdAt).toLocaleString()}</span>
    `;
    elements.moodList.appendChild(item);
  });
};

const initEvents = () => {
  elements.saveConfig.addEventListener("click", saveConfig);

  elements.signIn.addEventListener("click", async () => {
    if (!state.auth) return;
    try {
      await signInWithEmailAndPassword(
        state.auth,
        elements.authEmail.value,
        elements.authPassword.value,
      );
    } catch (error) {
      alert(error.message);
    }
  });

  elements.signUp.addEventListener("click", async () => {
    if (!state.auth) return;
    try {
      await createUserWithEmailAndPassword(
        state.auth,
        elements.authEmail.value,
        elements.authPassword.value,
      );
    } catch (error) {
      alert(error.message);
    }
  });

  elements.signInAnon.addEventListener("click", async () => {
    if (!state.auth) return;
    try {
      await signInAnonymously(state.auth);
    } catch (error) {
      alert(error.message);
    }
  });

  elements.signOut.addEventListener("click", async () => {
    if (!state.auth) return;
    try {
      await signOut(state.auth);
    } catch (error) {
      alert(error.message);
    }
  });

  elements.startSession.addEventListener("click", async () => {
    if (!requireAuth()) return;
    try {
      const data = await callApi("/v1/sessions", {
        goal: elements.sessionGoal.value,
        mood: elements.sessionMood.value,
      });
      showSafety(data.safety);
      if (data.safety?.blocked) {
        elements.sessionTranscript.textContent = "Session wurde aus Sicherheitsgründen gestoppt.";
        return;
      }
      elements.sessionTranscript.textContent = data.transcript || "Keine Antwort erhalten.";
      if (data.audioUrl) {
        elements.sessionAudio.src = data.audioUrl;
        try {
          await elements.sessionAudio.play();
        } catch (error) {
          console.warn("Audio konnte nicht automatisch gestartet werden.", error);
        }
      }
    } catch (error) {
      alert(error.message);
    }
  });

  elements.chatSend.addEventListener("click", async () => {
    if (!requireAuth()) return;
    const message = elements.chatInput.value.trim();
    if (!message) return;
    state.chatMessages.push({ role: "user", content: message });
    renderChat();
    elements.chatInput.value = "";

    try {
      const data = await callApi("/v1/chat", { message });
      showSafety(data.safety);
      if (data.safety?.blocked) {
        state.chatMessages.push({
          role: "assistant",
          content: data.safety.message || "Ich kann darauf gerade nicht eingehen.",
        });
      } else {
        state.chatMessages.push({ role: "assistant", content: data.reply });
      }
      renderChat();
    } catch (error) {
      alert(error.message);
    }
  });

  elements.saveMood.addEventListener("click", async () => {
    if (!requireAuth()) return;
    const label = elements.moodLabel.value.trim();
    if (!label) {
      alert("Bitte ein Mood-Label angeben.");
      return;
    }
    try {
      const data = await callApi("/v1/mood", {
        label,
        notes: elements.moodNotes.value.trim(),
      });
      state.moods.unshift({
        label: data.label,
        notes: data.notes,
        createdAt: data.createdAt || new Date().toISOString(),
      });
      renderMoods();
      elements.moodLabel.value = "";
      elements.moodNotes.value = "";
    } catch (error) {
      alert(error.message);
    }
  });
};

const boot = () => {
  const { firebaseConfig, apiBaseUrl } = loadStoredConfig();
  if (firebaseConfig) {
    elements.firebaseConfig.value = JSON.stringify(firebaseConfig, null, 2);
  }
  elements.apiBaseUrl.value = apiBaseUrl;
  state.apiBaseUrl = apiBaseUrl;
  initFirebase(firebaseConfig);
  initEvents();
};

boot();
