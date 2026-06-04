import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/yan_widgets.dart';

/// 消息状态
class MessagesState {
  final List<Conversation> conversations;
  final bool isLoading;

  const MessagesState({this.conversations = const [], this.isLoading = false});

  MessagesState copyWith({List<Conversation>? conversations, bool? isLoading}) {
    return MessagesState(
      conversations: conversations ?? this.conversations,
      isLoading: isLoading ?? this.isLoading,
    );
  }
}

class Message {
  final String id;
  final String text;
  final DateTime time;
  final bool sent; // true=outgoing, false=incoming
  final bool seen;

  const Message({required this.id, required this.text, required this.time, required this.sent, this.seen = false});
}

class Conversation {
  final String id;
  final String name;
  final String handle;
  final String avatar;
  final String avatarBg;
  final String preview;
  final String time;
  final int unread;
  final bool online;
  final List<Message> messages;

  const Conversation({
    required this.id,
    required this.name,
    required this.handle,
    required this.avatar,
    required this.avatarBg,
    required this.preview,
    required this.time,
    this.unread = 0,
    this.online = false,
    this.messages = const [],
  });
}

class MessagesNotifier extends StateNotifier<MessagesState> {
  MessagesNotifier() : super(const MessagesState()) {
    _loadMockData();
  }

  void _loadMockData() {
    final now = DateTime.now();
    state = state.copyWith(
      conversations: [
        Conversation(
          id: 'c1',
          name: '李明',
          handle: '@liming',
          avatar: '李',
          avatarBg: 'linear-gradient(135deg,#667eea,#764ba2)',
          preview: '好的，那我们约个时间见面吧！',
          time: '刚刚',
          unread: 2,
          online: true,
          messages: [
            Message(id: 'm1', text: '嗨，最近怎么样？', time: now.subtract(Duration(hours: 3)), sent: false, seen: true),
            Message(id: 'm2', text: '挺好的，刚完成一个项目', time: now.subtract(Duration(hours: 2, minutes: 55)), sent: true, seen: true),
            Message(id: 'm3', text: '太棒了！有空出来吃饭吗？', time: now.subtract(Duration(hours: 2, minutes: 50)), sent: false, seen: true),
            Message(id: 'm4', text: '好的，那我们约个时间见面吧！', time: now.subtract(Duration(minutes: 30)), sent: false, seen: false),
          ],
        ),
        Conversation(
          id: 'c2',
          name: '王芳',
          handle: '@wangfang',
          avatar: '王',
          avatarBg: 'linear-gradient(135deg,#f093fb,#f5576c)',
          preview: '谢谢你的分享，很有帮助',
          time: '10分钟前',
          unread: 0,
          online: false,
          messages: [
            Message(id: 'm5', text: '这是一个很好的资源', time: now.subtract(Duration(hours: 1)), sent: false, seen: true),
            Message(id: 'm6', text: '谢谢你的分享，很有帮助', time: now.subtract(Duration(minutes: 10)), sent: false, seen: true),
          ],
        ),
        Conversation(
          id: 'c3',
          name: '张伟',
          handle: '@zhangwei',
          avatar: '张',
          avatarBg: 'linear-gradient(135deg,#4facfe,#00f2fe)',
          preview: '新帖子发布了吗？',
          time: '1小时前',
          unread: 1,
          online: true,
          messages: [
            Message(id: 'm7', text: '你发的文章我看了，写得真好', time: now.subtract(Duration(hours: 5)), sent: false, seen: true),
            Message(id: 'm8', text: '新帖子发布了吗？', time: now.subtract(Duration(hours: 1)), sent: false, seen: false),
          ],
        ),
        Conversation(
          id: 'c4',
          name: '刘洋',
          handle: '@liuyang',
          avatar: '刘',
          avatarBg: 'linear-gradient(135deg,#43e97b,#38f9d7)',
          preview: '周末一起去爬山吗？',
          time: '2小时前',
          unread: 0,
          online: false,
          messages: [
            Message(id: 'm9', text: '周末一起去爬山吗？', time: now.subtract(Duration(hours: 2)), sent: true, seen: true),
          ],
        ),
        Conversation(
          id: 'c5',
          name: '陈静',
          handle: '@chenjing',
          avatar: '陈',
          avatarBg: 'linear-gradient(135deg,#fa709a,#fee140)',
          preview: '收到，我看看',
          time: '昨天',
          unread: 0,
          online: false,
          messages: [
            Message(id: 'm10', text: '文件我发你了', time: now.subtract(Duration(days: 1, hours: 3)), sent: false, seen: true),
            Message(id: 'm11', text: '收到，我看看', time: now.subtract(Duration(days: 1)), sent: false, seen: true),
          ],
        ),
      ],
    );
  }
}

final messagesProvider = StateNotifierProvider<MessagesNotifier, MessagesState>((ref) {
  return MessagesNotifier();
});

/// 消息页
class MessagesPage extends ConsumerWidget {
  const MessagesPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final messagesState = ref.watch(messagesProvider);

    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        backgroundColor: AppColors.bg,
        title: const Text('消息', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800)),
        actions: [
          IconButton(
            icon: const Icon(Icons.edit_square, color: AppColors.text, size: 22),
            onPressed: () {},
          ),
        ],
      ),
      body: messagesState.conversations.isEmpty
          ? const Center(child: Text('暂无消息', style: TextStyle(color: AppColors.text2)))
          : ListView.builder(
              itemCount: messagesState.conversations.length,
              itemBuilder: (context, index) {
                final conv = messagesState.conversations[index];
                return _ConversationItem(conversation: conv);
              },
            ),
    );
  }
}

class _ConversationItem extends StatelessWidget {
  final Conversation conversation;

  const _ConversationItem({required this.conversation});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: () => context.push('/chat/${conversation.id}'),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: const BoxDecoration(
          border: Border(bottom: BorderSide(color: AppColors.border, width: 0.5)),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Stack(
              children: [
                YanAvatar(avatar: conversation.avatar, avatarBg: conversation.avatarBg, size: 52, fontSize: 20),
                if (conversation.online)
                  Positioned(
                    right: 0,
                    bottom: 0,
                    child: Container(
                      width: 14,
                      height: 14,
                      decoration: BoxDecoration(
                        color: const Color(0xFF43A047),
                        shape: BoxShape.circle,
                        border: Border.all(color: AppColors.bg, width: 2),
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Text(
                        conversation.name,
                        style: TextStyle(
                          fontWeight: conversation.unread > 0 ? FontWeight.w800 : FontWeight.w600,
                          fontSize: 16,
                          color: AppColors.text,
                        ),
                      ),
                      const SizedBox(width: 4),
                      Text(
                        conversation.handle,
                        style: const TextStyle(fontSize: 15, color: AppColors.text2),
                      ),
                      const Spacer(),
                      Text(
                        conversation.time,
                        style: const TextStyle(fontSize: 14, color: AppColors.text2),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          conversation.preview,
                          style: TextStyle(
                            fontSize: 15,
                            color: conversation.unread > 0 ? AppColors.text : AppColors.text2,
                            fontWeight: conversation.unread > 0 ? FontWeight.w500 : FontWeight.w400,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      if (conversation.unread > 0)
                        Container(
                          margin: const EdgeInsets.only(left: 8),
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                          decoration: BoxDecoration(
                            color: AppColors.accent,
                            borderRadius: BorderRadius.circular(9999),
                          ),
                          child: Text(
                            '${conversation.unread}',
                            style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.bg),
                          ),
                        ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}