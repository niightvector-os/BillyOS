"use client";

import { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";

type ImageResult = { title: string; url: string; pageUrl: string };
type LocationResult = { name: string; description: string; lat: number; lng: number };
type SourceResult = { title: string; url: string };
type Message = {
  role: "user" | "assistant";
  content: string;
  images?: ImageResult[];
  mapLocations?: LocationResult[];
  sources?: SourceResult[];
  stopped?: boolean;
};
type ConversationSummary = { id: string; title: string; pinned: boolean; mode: string; project_id: string | null };
type ProjectSummary = { id: string; name: string };
type Profile = { display_name: string | null; nickname: string | null; occupation: string | null; about_text: string | null; complexity: "simple" | "normal" | "expert"; preferred_language: string };
type PendingLoad = { mode: string; title: string; data: Record<string, unknown> } | null;

type ChatContextType = {
  messages: Message[];
  loading: boolean;
  isSearching: boolean;
  usageWarning: string | null;
  signupPromptOpen: boolean;
  closeSignupPrompt: () => void;
  conversations: ConversationSummary[];
  projects: ProjectSummary[];
  profile: Profile;
  activeConversationId: string | null;
  pendingLoad: PendingLoad;
  sendMessage: (displayText: string, promptOverride?: string) => Promise<void>;
  sendResearchMessage: (query: string) => Promise<void>;
  saveModeResult: (mode: string, title: string, data: Record<string, unknown>) => Promise<void>;
  requestLoad: (id: string) => Promise<void>;
  clearPendingLoad: () => void;
  stopGeneration: () => void;
  startNewChat: (projectId?: string) => void;
  loadConversation: (id: string) => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;
  createProject: (name: string) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  renameProject: (id: string, name: string) => Promise<void>;
  updateProfile: (fields: Partial<Profile>) => Promise<void>;
  clearAllConversations: () => Promise<void>;
  truncateForEdit: (index: number) => Promise<void>;
  togglePinned: (id: string, value: boolean) => Promise<void>;
  renameConversation: (id: string, title: string) => Promise<void>;
  moveToProject: (id: string, projectId: string) => Promise<void>;
};

const ChatContext = createContext<ChatContextType | null>(null);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [usageWarning, setUsageWarning] = useState<string | null>(null);
  const [signupPromptOpen, setSignupPromptOpen] = useState(false);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [profile, setProfile] = useState<Profile>({ display_name: null, nickname: null, occupation: null, about_text: null, complexity: "normal", preferred_language: "en" });
  const [pendingLoad, setPendingLoad] = useState<PendingLoad>(null);
  const pendingProjectId = useRef<string | undefined>(undefined);
  const controllerRef = useRef<AbortController | null>(null);
  const supabase = createClient();

  const closeSignupPrompt = useCallback(() => setSignupPromptOpen(false), []);

  const refreshConversations = useCallback(async () => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) { setConversations([]); return; }
    const { data } = await supabase
      .from("conversations")
      .select("id, title, pinned, mode, project_id")
      .order("updated_at", { ascending: false })
      .limit(50);
    setConversations(data ?? []);
  }, []);

  const refreshProjects = useCallback(async () => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) { setProjects([]); return; }
    const { data } = await supabase
      .from("projects")
      .select("id, name")
      .order("created_at", { ascending: false });
    setProjects(data ?? []);
  }, []);

  const refreshProfile = useCallback(async () => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;
    const { data } = await supabase
      .from("profiles")
      .select("display_name, nickname, occupation, about_text, complexity, preferred_language")
      .eq("id", userData.user.id)
      .single();
    if (data) {
      setProfile(data as Profile);
    } else {
      await supabase.from("profiles").upsert({ id: userData.user.id }, { onConflict: "id", ignoreDuplicates: true });
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    async function loadInitialData() {
      if (ignore) return;
      await Promise.all([refreshConversations(), refreshProjects(), refreshProfile()]);
    }
    loadInitialData();
    return () => {
      ignore = true;
    };
  }, [refreshConversations, refreshProjects, refreshProfile]);

  function startNewChat(projectId?: string) {
    controllerRef.current?.abort();
    controllerRef.current = null;
    setLoading(false);
    setConversationId(null);
    setMessages([]);
    pendingProjectId.current = projectId;
  }

  async function loadConversation(id: string) {
    const { data } = await supabase
      .from("messages")
      .select("role, content")
      .eq("conversation_id", id)
      .order("created_at", { ascending: true });
    setConversationId(id);
    setMessages((data as Message[]) ?? []);
  }

  async function requestLoad(id: string) {
    const { data } = await supabase
      .from("conversations")
      .select("title, mode, data")
      .eq("id", id)
      .single();
    if (data) setPendingLoad({ mode: data.mode, title: data.title, data: data.data });
  }

  function clearPendingLoad() {
    setPendingLoad(null);
  }

  async function saveModeResult(mode: string, title: string, data: Record<string, unknown>) {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) return;
    await supabase.from("conversations").insert({
      user_id: user.id,
      title: title.slice(0, 60),
      mode,
      data,
      project_id: pendingProjectId.current ?? null,
    });
    pendingProjectId.current = undefined;
    refreshConversations();
  }

  async function deleteConversation(id: string) {
    await supabase.from("conversations").delete().eq("id", id);
    if (id === conversationId) {
      setConversationId(null);
      setMessages([]);
    }
    refreshConversations();
  }

  async function createProject(name: string) {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;
    await supabase.from("projects").insert({ user_id: userData.user.id, name: name.slice(0, 50) });
    refreshProjects();
  }

  async function renameProject(id: string, name: string) {
    await supabase.from("projects").update({ name }).eq("id", id);
    refreshProjects();
  }

  async function deleteProject(id: string) {
    await supabase.from("projects").delete().eq("id", id);
    refreshProjects();
    refreshConversations();
  }

  async function updateProfile(fields: Partial<Profile>) {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;
    await supabase.from("profiles").update(fields).eq("id", userData.user.id);
    setProfile((p) => ({ ...p, ...fields }));
  }

  async function clearAllConversations() {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;
    await supabase.from("conversations").delete().eq("user_id", userData.user.id);
    setConversationId(null);
    setMessages([]);
    refreshConversations();
  }

  function stopGeneration() {
    controllerRef.current?.abort();
  }

  async function generateTitle(conversationId: string, firstMessage: string) {
    try {
      const res = await fetch("/api/title", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: firstMessage }),
      });
      const { title } = await res.json();
      await supabase.from("conversations").update({ title }).eq("id", conversationId);
      refreshConversations();
    } catch {
      // nice-to-have — keep the fallback title on failure
    }
  }

  async function ensureConversation(firstMessage: string) {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    let activeId = conversationId;

    if (user && !activeId) {
      const { data: convo } = await supabase
        .from("conversations")
        .insert({ user_id: user.id, title: firstMessage.slice(0, 40), mode: "chat", project_id: pendingProjectId.current ?? null })
        .select()
        .single();
      if (convo) {
        activeId = convo.id;
        setConversationId(convo.id);
        pendingProjectId.current = undefined;
        refreshConversations();
        generateTitle(convo.id, firstMessage);
      }
    }
    return { user, activeId };
  }

  async function truncateForEdit(index: number) {
    const truncated = messages.slice(0, index);
    setMessages(truncated);
    if (conversationId) {
      await supabase.from("messages").delete().eq("conversation_id", conversationId);
      if (truncated.length > 0) {
        await supabase.from("messages").insert(
          truncated.map((m) => ({ conversation_id: conversationId, role: m.role, content: m.content }))
        );
      }
    }
  }

  async function sendMessage(displayText: string, promptOverride?: string) {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;

    const userMessage: Message = { role: "user", content: displayText };
    const nextMessages = [...messages, userMessage];
    let assistantMsg: Message = { role: "assistant", content: "" };
    setMessages([...nextMessages, assistantMsg]);
    setLoading(true);

    let activeId = conversationId;
    const isNewConversation = user && !activeId;

    if (isNewConversation) {
      const { data: convo } = await supabase
        .from("conversations")
        .insert({ user_id: user.id, title: displayText.slice(0, 40), mode: "chat", project_id: pendingProjectId.current ?? null })
        .select()
        .single();
      if (convo) {
        activeId = convo.id;
        setConversationId(convo.id);
        pendingProjectId.current = undefined;
        refreshConversations();
        generateTitle(convo.id, displayText);
      }
    }

    if (user && activeId) {
      await supabase.from("messages").insert({
        conversation_id: activeId,
        role: "user",
        content: displayText,
      });
    }

    const enrichPromise = !promptOverride
      ? fetch("/api/enrich", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: displayText }),
        })
          .then((r) => r.json())
          .catch(() => null)
      : Promise.resolve(null);

    const apiMessages = [...nextMessages];
    if (promptOverride) {
      apiMessages[apiMessages.length - 1] = { role: "user", content: promptOverride };
    }

    const controller = new AbortController();
    controllerRef.current = controller;

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ messages: apiMessages, complexity: profile.complexity, personalization: profile }),
        signal: controller.signal,
      });

      const usageCount = Number(res.headers.get("X-Billy-Usage-Count") || 0);
      const usageLimit = Number(res.headers.get("X-Billy-Usage-Limit") || 0);
      if (usageLimit > 0) {
        const pct = usageCount / usageLimit;
        if (pct >= 0.9) setUsageWarning(`You're close to today's message limit (${usageCount}/${usageLimit}).`);
        else if (pct >= 0.5) setUsageWarning(`You've used over half of today's messages (${usageCount}/${usageLimit}).`);
        else setUsageWarning(null);
      }

      const searched = res.headers.get("X-Billy-Searched") === "true";
      let searchSources: { title: string; url: string }[] = [];
      try {
        const raw = res.headers.get("X-Billy-Sources");
        if (raw) searchSources = JSON.parse(decodeURIComponent(raw));
      } catch {}
      if (searched) setIsSearching(true);

      if (!res.ok) {
        setIsSearching(false);
        const err = await res.json().catch(() => null);
        if (err?.code === "ANON_LIMIT_REACHED") {
          setSignupPromptOpen(true);
          setMessages(nextMessages); // drop the empty assistant placeholder — no error bubble for this case
        } else {
          assistantMsg = { ...assistantMsg, content: err?.error || "Sorry — the AI is temporarily unavailable. Please try again." };
          setMessages([...nextMessages, { ...assistantMsg }]);
        }
      } else {
        const reader = res.body?.getReader();
        const decoder = new TextDecoder();
        let searchingFirstChunk = true;
        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            if (searchingFirstChunk) { setIsSearching(false); searchingFirstChunk = false; }
            assistantMsg = { ...assistantMsg, content: assistantMsg.content + decoder.decode(value, { stream: true }) };
            setMessages([...nextMessages, { ...assistantMsg }]);
          }
        }
      }
      setIsSearching(false);
      if (searchSources.length > 0) {
        assistantMsg = { ...assistantMsg, sources: searchSources };
        setMessages([...nextMessages, { ...assistantMsg }]);
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        assistantMsg = { ...assistantMsg, content: "Sorry — something went wrong reaching the AI. Please try again." };
        setMessages([...nextMessages, { ...assistantMsg }]);
      } else {
        assistantMsg = { ...assistantMsg, stopped: true };
        setMessages([...nextMessages, { ...assistantMsg }]);
      }
    }

    const enrichment = await enrichPromise;
    if (enrichment && (enrichment.images?.length || enrichment.mapLocations?.length)) {
      assistantMsg = { ...assistantMsg, images: enrichment.images, mapLocations: enrichment.mapLocations };
      setMessages([...nextMessages, { ...assistantMsg }]);
    }

    if (user && activeId && assistantMsg.content) {
      await supabase.from("messages").insert({
        conversation_id: activeId,
        role: "assistant",
        content: assistantMsg.content,
      });
      await supabase
        .from("conversations")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", activeId);
      refreshConversations();
    }

    controllerRef.current = null;
    setLoading(false);
  }

  async function sendResearchMessage(query: string) {
    const { user, activeId: ensuredId } = await ensureConversation(query);
    const activeId = ensuredId;

    const userMessage: Message = { role: "user", content: query };
    const nextMessages = [...messages, userMessage];
    setMessages([...nextMessages, { role: "assistant", content: "" }]);
    setLoading(true);

    if (user && activeId) {
      await supabase.from("messages").insert({
        conversation_id: activeId,
        role: "user",
        content: query,
      });
    }

    // Give Research the last exchange as context, so follow-ups like
    // "his viral songs in 2026" resolve pronouns correctly instead of
    // being searched as a standalone, ambiguous query.
    const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    const contextualQuery =
      lastUser && lastAssistant
        ? `Previous question: "${lastUser.content}"\nPrevious answer summary: "${lastAssistant.content.slice(0, 300)}"\n\nFollow-up question: ${query}`
        : query;

    let assistantMsg: Message = { role: "assistant", content: "" };

    try {
      const res = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: contextualQuery, preferred_language: profile.preferred_language }),
      });
      const data = await res.json();

      if (!res.ok || data.error) {
        assistantMsg = { role: "assistant", content: data.error || "Couldn't complete the research. Please try again." };
      } else {
        assistantMsg = { role: "assistant", content: data.answer, sources: data.sources };
      }
    } catch {
      assistantMsg = { role: "assistant", content: "Sorry — something went wrong during research. Please try again." };
    }

    setMessages([...nextMessages, assistantMsg]);

    if (user && activeId && assistantMsg.content) {
      await supabase.from("messages").insert({
        conversation_id: activeId,
        role: "assistant",
        content: assistantMsg.content,
      });
      await supabase
        .from("conversations")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", activeId);
      refreshConversations();
    }

    setLoading(false);
  }

  async function togglePinned(id: string, value: boolean) {
    await supabase.from("conversations").update({ pinned: value }).eq("id", id);
    refreshConversations();
  }

  async function renameConversation(id: string, title: string) {
    await supabase.from("conversations").update({ title }).eq("id", id);
    refreshConversations();
  }

  async function moveToProject(id: string, projectId: string) {
    await supabase.from("conversations").update({ project_id: projectId }).eq("id", id);
    refreshConversations();
  }

  return (
    <ChatContext.Provider
      value={{
        messages,
        loading,
        isSearching,
        usageWarning,
        signupPromptOpen,
        closeSignupPrompt,
        conversations,
        projects,
        profile,
        activeConversationId: conversationId,
        pendingLoad,
        sendMessage,
        sendResearchMessage,
        saveModeResult,
        requestLoad,
        clearPendingLoad,
        stopGeneration,
        startNewChat,
        loadConversation,
        deleteConversation,
        createProject,
        deleteProject,
        renameProject,
        updateProfile,
        clearAllConversations,
        truncateForEdit,
        togglePinned,
        renameConversation,
        moveToProject,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used within ChatProvider");
  return ctx;
}
