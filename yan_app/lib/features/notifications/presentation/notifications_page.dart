import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/yan_widgets.dart';

/// 通知类型
enum NotifType { like, retweet, reply, follow, mention }

class AppNotification {
  final String id;
  final NotifType type;
  final String name;
  final String handle;
  final String avatar;
  final String avatarBg;
  final String text;
  final String time;
  final DateTime createdAt;
  final bool unread;
  final String? target;
  final String? tweetId;

  const AppNotification({
    required this.id,
    required this.type,
    required this.name,
    required this.handle,
    required this.avatar,
    required this.avatarBg,
    required this.text,
    required this.time,
    required this.createdAt,
    this.unread = false,
    this.target,
    this.tweetId,
  });

  AppNotification copyWith({bool? unread}) {
    return AppNotification(
      id: id, type: type, name: name, handle: handle,
      avatar: avatar, avatarBg: avatarBg, text: text, time: time,
      createdAt: createdAt, unread: unread ?? this.unread, target: target, tweetId: tweetId,
    );
  }
}

class NotificationsState {
  final List<AppNotification> notifications;
  final bool isLoading;
  final String tab; // 'all' | 'mentions'
  final bool hasUnread;

  const NotificationsState({
    this.notifications = const [],
    this.isLoading = false,
    this.tab = 'all',
    this.hasUnread = false,
  });

  NotificationsState copyWith({
    List<AppNotification>? notifications,
    bool? isLoading,
    String? tab,
    bool? hasUnread,
  }) {
    return NotificationsState(
      notifications: notifications ?? this.notifications,
      isLoading: isLoading ?? this.isLoading,
      tab: tab ?? this.tab,
      hasUnread: hasUnread ?? this.hasUnread,
    );
  }
}

class NotificationsNotifier extends StateNotifier<NotificationsState> {
  NotificationsNotifier() : super(const NotificationsState()) {
    _loadMockData();
  }

  void _loadMockData() {
    final now = DateTime.now();
    state = state.copyWith(
      notifications: List.generate(15, (i) {
        final types = [NotifType.like, NotifType.retweet, NotifType.reply, NotifType.follow, NotifType.mention];
        final type = types[i % types.length];
        final names = ['李明', '王芳', '张伟', '刘洋', '陈静', '杨帆', '赵磊', '黄丽'];
        final handles = ['@liming', '@wangfang', '@zhangwei', '@liuyang', '@chenjing', '@yangfan', '@zhaolei', '@huangli'];
        final texts = {
          NotifType.like: '赞了你的帖子',
          NotifType.retweet: '转帖了你的帖子',
          NotifType.reply: '回复了你的帖子',
          NotifType.follow: '关注了你',
          NotifType.mention: '在帖子中提及了你',
        };
        return AppNotification(
          id: 'n_$i',
          type: type,
          name: names[i % names.length],
          handle: handles[i % handles.length],
          avatar: names[i % names.length].substring(0, 1),
          avatarBg: _gradients[i % _gradients.length],
          text: texts[type]!,
          time: '${i + 1}小时前',
          createdAt: now.subtract(Duration(hours: i + 1)),
          unread: i < 3,
          target: type == NotifType.reply || type == NotifType.mention ? '这是被回复的帖子内容预览...' : null,
        );
      }),
      hasUnread: true,
    );
  }

  void switchTab(String tab) {
    state = state.copyWith(tab: tab);
  }

  void markAllRead() {
    state = state.copyWith(
      hasUnread: false,
      notifications: state.notifications.map((n) => n.copyWith(unread: false)).toList(),
    );
  }

  void markRead(String id) {
    final idx = state.notifications.indexWhere((n) => n.id == id);
    if (idx == -1) return;
    final updated = state.notifications[idx].copyWith(unread: false);
    final newList = [...state.notifications];
    newList[idx] = updated;
    final hasUnread = newList.any((n) => n.unread);
    state = state.copyWith(notifications: newList, hasUnread: hasUnread);
  }

  static const _gradients = [
    'linear-gradient(135deg,#667eea,#764ba2)',
    'linear-gradient(135deg,#f093fb,#f5576c)',
    'linear-gradient(135deg,#4facfe,#00f2fe)',
    'linear-gradient(135deg,#43e97b,#38f9d7)',
    'linear-gradient(135deg,#fa709a,#fee140)',
    'linear-gradient(135deg,#a18cd1,#fbc2eb)',
  ];
}

final notificationsProvider = StateNotifierProvider<NotificationsNotifier, NotificationsState>((ref) {
  return NotificationsNotifier();
});

/// 通知页
class NotificationsPage extends ConsumerStatefulWidget {
  const NotificationsPage({super.key});

  @override
  ConsumerState<NotificationsPage> createState() => _NotificationsPageState();
}

class _NotificationsPageState extends ConsumerState<NotificationsPage> {
  @override
  Widget build(BuildContext context) {
    final notifState = ref.watch(notificationsProvider);

    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        backgroundColor: AppColors.bg,
        title: const Text('通知', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800)),
        actions: [
          if (notifState.hasUnread)
            TextButton(
              onPressed: () => ref.read(notificationsProvider.notifier).markAllRead(),
              child: const Text('全部已读', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700)),
            ),
        ],
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(48),
          child: Container(
            decoration: const BoxDecoration(border: Border(bottom: BorderSide(color: AppColors.border, width: 0.5))),
            child: Row(
              children: [
                _Tab(label: '全部', isActive: notifState.tab == 'all', onTap: () => ref.read(notificationsProvider.notifier).switchTab('all')),
                _Tab(label: '提及', isActive: notifState.tab == 'mentions', onTap: () => ref.read(notificationsProvider.notifier).switchTab('mentions')),
              ],
            ),
          ),
        ),
      ),
      body: notifState.notifications.isEmpty
          ? const Center(child: Text('暂无通知', style: TextStyle(color: AppColors.text2)))
          : ListView.builder(
              itemCount: notifState.notifications.length,
              itemBuilder: (context, index) {
                final notif = notifState.notifications[index];
                return _NotifItem(notif: notif);
              },
            ),
    );
  }
}

class _Tab extends StatelessWidget {
  final String label;
  final bool isActive;
  final VoidCallback onTap;

  const _Tab({required this.label, required this.isActive, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: InkWell(
        onTap: onTap,
        child: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                label,
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: isActive ? FontWeight.w700 : FontWeight.w500,
                  color: isActive ? AppColors.text : AppColors.text2,
                ),
              ),
              if (isActive) const SizedBox(height: 4),
              if (isActive)
                Container(
                  width: 56,
                  height: 3,
                  decoration: BoxDecoration(
                    color: AppColors.accent,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class _NotifItem extends StatelessWidget {
  final AppNotification notif;

  const _NotifItem({required this.notif});

  IconData get _icon {
    switch (notif.type) {
      case NotifType.like: return Icons.favorite;
      case NotifType.retweet: return Icons.repeat;
      case NotifType.reply: return Icons.chat_bubble_outline;
      case NotifType.follow: return Icons.person_add;
      case NotifType.mention: return Icons.alternate_email;
    }
  }

  Color get _iconColor {
    switch (notif.type) {
      case NotifType.like: return AppColors.pink;
      case NotifType.retweet: return AppColors.green;
      case NotifType.reply: return const Color(0xFFA855F7);
      case NotifType.follow: return AppColors.accent;
      case NotifType.mention: return const Color(0xFFA855F7);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        border: const Border(bottom: BorderSide(color: AppColors.border, width: 0.5)),
        color: notif.unread ? AppColors.bg2.withOpacity(0.3) : null,
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // X-style blue left border for unread
          if (notif.unread)
            Container(
              width: 3,
              height: double.infinity,
              margin: const EdgeInsets.only(right: 8),
              decoration: const BoxDecoration(
                color: AppColors.accent,
                borderRadius: BorderRadius.all(Radius.circular(2)),
              ),
            ),
          // 通知图标
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(shape: BoxShape.circle, color: _iconColor.withOpacity(0.15)),
            child: Icon(_icon, size: 20, color: _iconColor),
          ),
          const SizedBox(width: 12),
          // 内容
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    YanAvatar(avatar: notif.avatar, avatarBg: notif.avatarBg, size: 24, fontSize: 12),
                    const SizedBox(width: 6),
                    Text(notif.name, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14, color: AppColors.text)),
                    if (notif.type == NotifType.follow) ...[
                      const SizedBox(width: 4),
                      const Text('开始关注你', style: TextStyle(fontSize: 14, color: AppColors.text2)),
                    ],
                  ],
                ),
                if (notif.type != NotifType.follow) ...[
                  const SizedBox(height: 4),
                  Text(notif.text, style: const TextStyle(fontSize: 14, color: AppColors.text)),
                ],
                if (notif.target != null) ...[
                  const SizedBox(height: 4),
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: AppColors.bg2,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      notif.target!,
                      style: const TextStyle(fontSize: 13, color: AppColors.text2),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
                const SizedBox(height: 4),
                Text(notif.time, style: const TextStyle(fontSize: 13, color: AppColors.text2)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}