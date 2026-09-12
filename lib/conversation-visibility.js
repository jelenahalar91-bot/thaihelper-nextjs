// Per-side visibility of a conversation.
//
// Deleting a conversation hides it from the deleter instead of destroying it
// (scripts/supabase-conversation-soft-delete.sql explains why: a hard delete
// let a retaliation review outlive the messages that disproved it, and
// deleting the review along with the thread would have handed helpers a way
// to scrub honest ones). The row and its messages always survive; each side
// carries its own marker for whether the thread shows up in their list.

/** Which side's hide-marker belongs to this role. */
export function deletedColumnFor(role) {
  return role === 'employer' ? 'deleted_by_employer_at' : 'deleted_by_helper_at';
}

/**
 * Bring a hidden conversation back for one side.
 *
 * Called when that side reopens the chat themselves. A new message clears
 * both markers instead, inline with the last_message_at bump in
 * /api/messages — a hidden thread must not swallow a message silently.
 *
 * Clearing an already-NULL marker is a no-op, so callers don't check first,
 * and a failure is logged rather than thrown: reopening a chat that stayed
 * hidden is a nuisance, not a reason to fail the request that opened it.
 */
export async function restoreConversationFor(supabase, conversationId, role) {
  const { error } = await supabase
    .from('conversations')
    .update({ [deletedColumnFor(role)]: null })
    .eq('id', conversationId);
  if (error) {
    console.error('Conversation restore error:', error.message);
  }
}
