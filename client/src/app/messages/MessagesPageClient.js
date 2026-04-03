"use client";

import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import axios from "../../../lib/axios";
import Button from "../../../components/ui/Button";
import PageHeader from "../../../components/ui/PageHeader";
import { useToast } from "../../../components/ui/Toast";
import { formatDateTime } from "../../../lib/domain";

const fetchConversations = async () => {
  const { data } = await axios.get("/chat/conversations");
  return Array.isArray(data) ? data : [];
};

const fetchConversation = async (conversationId) => {
  const { data } = await axios.get(`/chat/conversations/${conversationId}`);
  return data;
};

const fetchServiceDetails = async (serviceId) => {
  const { data } = await axios.get(`/services/${serviceId}/details`);
  return data;
};

const parseSearchParamId = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const getMessagePreview = (value) => {
  const content = String(value ?? "").trim();
  if (!content) return "No messages yet.";
  return content.length > 96 ? `${content.slice(0, 93)}...` : content;
};

export default function MessagesPageClient() {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: session } = useSession();
  const [selectedConversationId, setSelectedConversationId] = React.useState(null);
  const [startMessage, setStartMessage] = React.useState("");
  const [replyMessage, setReplyMessage] = React.useState("");

  const requestedServiceId = parseSearchParamId(searchParams.get("serviceId"));
  const requestedConversationId = parseSearchParamId(
    searchParams.get("conversationId")
  );
  const currentUserId = Number(session?.user?.id);
  const normalizedRole = String(session?.user?.role ?? "")
    .trim()
    .toUpperCase();

  const {
    data: conversations = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["chat-conversations"],
    queryFn: fetchConversations,
  });

  const requestedConversation = React.useMemo(
    () =>
      conversations.find((conversation) => conversation.id === requestedConversationId) ??
      null,
    [conversations, requestedConversationId]
  );

  const requestedServiceConversation = React.useMemo(
    () =>
      conversations.find(
        (conversation) => conversation.service?.id === requestedServiceId
      ) ?? null,
    [conversations, requestedServiceId]
  );

  React.useEffect(() => {
    if (requestedConversation?.id) {
      setSelectedConversationId(requestedConversation.id);
      return;
    }

    if (requestedServiceConversation?.id) {
      setSelectedConversationId(requestedServiceConversation.id);
      return;
    }

    setSelectedConversationId((currentValue) => {
      if (requestedServiceId) {
        if (
          currentValue &&
          conversations.some((conversation) => conversation.id === currentValue)
        ) {
          return currentValue;
        }

        return null;
      }

      if (
        currentValue &&
        conversations.some((conversation) => conversation.id === currentValue)
      ) {
        return currentValue;
      }

      return conversations[0]?.id ?? null;
    });
  }, [
    conversations,
    requestedConversation?.id,
    requestedServiceConversation?.id,
    requestedServiceId,
  ]);

  const activeConversationId = selectedConversationId;

  const {
    data: activeConversation,
    isLoading: activeConversationLoading,
    isError: activeConversationError,
    error: activeConversationErrorValue,
  } = useQuery({
    queryKey: ["chat-conversation", activeConversationId],
    queryFn: () => fetchConversation(activeConversationId),
    enabled: Boolean(activeConversationId),
  });

  const shouldLoadRequestedService =
    Boolean(requestedServiceId) && !requestedServiceConversation;

  const {
    data: requestedService,
    isLoading: requestedServiceLoading,
    isError: requestedServiceError,
    error: requestedServiceErrorValue,
  } = useQuery({
    queryKey: ["service-details", requestedServiceId, "chat-start"],
    queryFn: () => fetchServiceDetails(requestedServiceId),
    enabled: shouldLoadRequestedService,
  });

  const canStartConversation =
    normalizedRole === "USER" &&
    currentUserId > 0 &&
    currentUserId !== Number(requestedService?.createdBy?.id);
  const isOwnRequestedService =
    currentUserId > 0 &&
    currentUserId === Number(requestedService?.createdBy?.id);

  const startConversationMutation = useMutation({
    mutationFn: async ({ serviceId, message }) => {
      const { data } = await axios.post("/chat/conversations", {
        serviceId,
        message,
      });
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["chat-conversations"] });
      queryClient.setQueryData(["chat-conversation", data.id], data);
      setSelectedConversationId(data.id);
      setStartMessage("");
      toast.success("Conversation started.");
    },
    onError: (err) => {
      toast.error(
        err?.response?.data?.message ?? "Unable to start conversation."
      );
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async ({ conversationId, message }) => {
      const { data } = await axios.post(
        `/chat/conversations/${conversationId}/messages`,
        {
          message,
        }
      );
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["chat-conversations"] });
      queryClient.setQueryData(["chat-conversation", data.id], data);
      setReplyMessage("");
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message ?? "Unable to send message.");
    },
  });

  const handleStartConversation = (event) => {
    event.preventDefault();

    if (!requestedServiceId || !startMessage.trim()) {
      return;
    }

    startConversationMutation.mutate({
      serviceId: requestedServiceId,
      message: startMessage.trim(),
    });
  };

  const handleSendMessage = (event) => {
    event.preventDefault();

    if (!activeConversationId || !replyMessage.trim()) {
      return;
    }

    sendMessageMutation.mutate({
      conversationId: activeConversationId,
      message: replyMessage.trim(),
    });
  };

  const renderConversationComposer = () => (
    <form onSubmit={handleSendMessage} className="rounded-2xl border border-[#E0E0E0] bg-white p-4">
      <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-[#7A7A7A]">
        Reply
      </label>
      <textarea
        value={replyMessage}
        onChange={(event) => setReplyMessage(event.target.value)}
        rows={4}
        placeholder="Write a message..."
        className="mt-3 w-full rounded-2xl border border-[#E0E0E0] bg-[#FAFAFA] px-4 py-3 text-sm text-[#0F0F0F] outline-none transition focus:border-[#0F0F0F]"
      />
      <div className="mt-3 flex justify-end">
        <Button
          type="submit"
          disabled={!replyMessage.trim() || sendMessageMutation.isPending}
        >
          Send message
        </Button>
      </div>
    </form>
  );

  const renderMessageList = (messages) => (
    <div className="flex min-h-[320px] flex-col gap-3 rounded-2xl border border-[#E0E0E0] bg-[#FCFCFC] p-4">
      {messages.length ? (
        messages.map((message) => (
          <article
            key={message.id}
            className={[
              "max-w-[85%] rounded-2xl px-4 py-3",
              message.isOwnMessage
                ? "ml-auto bg-[#0F0F0F] text-white"
                : "bg-white text-[#0F0F0F] border border-[#E0E0E0]",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <div className="text-xs font-semibold opacity-70">
              {message.sender?.name || "Unknown user"}
            </div>
            <p className="mt-1 whitespace-pre-wrap text-sm leading-6">
              {message.body}
            </p>
            <div className="mt-2 text-[11px] opacity-70">
              {formatDateTime(message.createdAt)}
            </div>
          </article>
        ))
      ) : (
        <div className="rounded-2xl border border-dashed border-[#E0E0E0] bg-white p-5 text-sm text-[#4B4B4B]">
          No messages yet.
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-white text-[#0F0F0F]">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-5 py-12">
        <PageHeader
          title="Messages"
          subtitle="Keep service questions and replies in one place for both clients and providers."
        />

        {isLoading ? (
          <div className="rounded-2xl border border-[#E0E0E0] bg-white p-6 text-sm text-[#4B4B4B]">
            Loading conversations...
          </div>
        ) : isError ? (
          <div className="rounded-2xl border border-[#F5C2C0] bg-white p-6 text-sm text-[#B42318]">
            {error?.response?.data?.message ||
              error?.message ||
              "Unable to load conversations."}
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
            <aside className="rounded-3xl border border-[#E0E0E0] bg-white p-4">
              <div className="px-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#7A7A7A]">
                Inbox
              </div>
              <div className="mt-4 grid gap-2">
                {conversations.length ? (
                  conversations.map((conversation) => {
                    const isActive = conversation.id === activeConversationId;

                    return (
                      <button
                        key={conversation.id}
                        type="button"
                        onClick={() => setSelectedConversationId(conversation.id)}
                        className={[
                          "rounded-2xl border px-4 py-4 text-left transition",
                          isActive
                            ? "border-[#0F0F0F] bg-[#0F0F0F] text-white"
                            : "border-[#E0E0E0] bg-[#FAFAFA] text-[#0F0F0F] hover:border-[#0F0F0F]",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold">
                              {conversation.otherParticipant?.name || "Unknown user"}
                            </div>
                            <div
                              className={[
                                "mt-1 truncate text-xs",
                                isActive ? "text-white/75" : "text-[#4B4B4B]",
                              ]
                                .filter(Boolean)
                                .join(" ")}
                            >
                              {conversation.service?.title || "Service"}
                            </div>
                          </div>
                          <div
                            className={[
                              "shrink-0 text-[11px]",
                              isActive ? "text-white/70" : "text-[#7A7A7A]",
                            ]
                              .filter(Boolean)
                              .join(" ")}
                          >
                            {formatDateTime(
                              conversation.latestMessage?.createdAt ??
                                conversation.lastMessageAt
                            )}
                          </div>
                        </div>
                        <p
                          className={[
                            "mt-3 text-sm leading-6",
                            isActive ? "text-white/88" : "text-[#4B4B4B]",
                          ]
                            .filter(Boolean)
                            .join(" ")}
                        >
                          {getMessagePreview(conversation.latestMessage?.body)}
                        </p>
                      </button>
                    );
                  })
                ) : (
                  <div className="rounded-2xl border border-dashed border-[#E0E0E0] bg-[#FAFAFA] p-5 text-sm text-[#4B4B4B]">
                    No conversations yet.
                  </div>
                )}
              </div>
            </aside>

            <section className="flex min-w-0 flex-col gap-4">
              {activeConversationId ? (
                activeConversationLoading ? (
                  <div className="rounded-3xl border border-[#E0E0E0] bg-white p-6 text-sm text-[#4B4B4B]">
                    Loading conversation...
                  </div>
                ) : activeConversationError ? (
                  <div className="rounded-3xl border border-[#F5C2C0] bg-white p-6 text-sm text-[#B42318]">
                    {activeConversationErrorValue?.response?.data?.message ||
                      activeConversationErrorValue?.message ||
                      "Unable to load this conversation."}
                  </div>
                ) : activeConversation ? (
                  <>
                    <div className="rounded-3xl border border-[#E0E0E0] bg-white p-6">
                      <div className="text-xs font-semibold uppercase tracking-[0.22em] text-[#7A7A7A]">
                        Conversation
                      </div>
                      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <h2 className="text-2xl font-semibold text-[#0F0F0F]">
                            {activeConversation.otherParticipant?.name ||
                              "Unknown user"}
                          </h2>
                          <p className="mt-1 text-sm text-[#4B4B4B]">
                            About {activeConversation.service?.title || "this service"}
                          </p>
                        </div>
                        <div className="rounded-2xl border border-[#E0E0E0] bg-[#FAFAFA] px-4 py-3 text-right">
                          <div className="text-xs uppercase tracking-wide text-[#7A7A7A]">
                            Last activity
                          </div>
                          <div className="text-sm font-semibold text-[#0F0F0F]">
                            {formatDateTime(activeConversation.lastMessageAt)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {renderMessageList(activeConversation.messages ?? [])}
                    {renderConversationComposer()}
                  </>
                ) : null
              ) : shouldLoadRequestedService ? (
                requestedServiceLoading ? (
                  <div className="rounded-3xl border border-[#E0E0E0] bg-white p-6 text-sm text-[#4B4B4B]">
                    Loading service conversation details...
                  </div>
                ) : requestedServiceError ? (
                  <div className="rounded-3xl border border-[#F5C2C0] bg-white p-6 text-sm text-[#B42318]">
                    {requestedServiceErrorValue?.response?.data?.message ||
                      requestedServiceErrorValue?.message ||
                      "Unable to load the selected service."}
                  </div>
                ) : requestedService ? (
                  <>
                    <div className="rounded-3xl border border-[#E0E0E0] bg-white p-6">
                      <div className="text-xs font-semibold uppercase tracking-[0.22em] text-[#7A7A7A]">
                        Start a conversation
                      </div>
                      <h2 className="mt-3 text-2xl font-semibold text-[#0F0F0F]">
                        {requestedService.title}
                      </h2>
                      <p className="mt-2 text-sm text-[#4B4B4B]">
                        You are about to message{" "}
                        <span className="font-semibold text-[#0F0F0F]">
                          {requestedService.createdBy?.name || "the provider"}
                        </span>
                        .
                      </p>
                    </div>

                    {canStartConversation ? (
                      <form
                        onSubmit={handleStartConversation}
                        className="rounded-3xl border border-[#E0E0E0] bg-white p-6"
                      >
                        <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-[#7A7A7A]">
                          First message
                        </label>
                        <textarea
                          value={startMessage}
                          onChange={(event) => setStartMessage(event.target.value)}
                          rows={6}
                          placeholder="Ask about availability, preparation, pricing, or anything else related to this service."
                          className="mt-3 w-full rounded-2xl border border-[#E0E0E0] bg-[#FAFAFA] px-4 py-3 text-sm text-[#0F0F0F] outline-none transition focus:border-[#0F0F0F]"
                        />
                        <div className="mt-4 flex justify-end">
                          <Button
                            type="submit"
                            disabled={
                              !startMessage.trim() ||
                              startConversationMutation.isPending
                            }
                          >
                            Start conversation
                          </Button>
                        </div>
                      </form>
                    ) : (
                      <div className="rounded-3xl border border-dashed border-[#E0E0E0] bg-white p-6 text-sm text-[#4B4B4B]">
                        {isOwnRequestedService
                          ? "You cannot start a conversation with yourself about your own service."
                          : "Only standard users can start a new conversation from a service."}
                      </div>
                    )}
                  </>
                ) : null
              ) : (
                <div className="rounded-3xl border border-dashed border-[#E0E0E0] bg-white p-8 text-sm text-[#4B4B4B]">
                  Select a conversation from the left, or start one from a
                  service details page.
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
