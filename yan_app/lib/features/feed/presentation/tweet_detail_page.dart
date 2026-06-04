import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/yan_widgets.dart';
import '../domain/tweet.dart';
import '../../auth/presentation/auth_provider.dart';
import 'feed_provider.dart';

/// Tweet 详情页
class TweetDetailPage extends ConsumerStatefulWidget {
  final String tweetId;

  const TweetDetailPage({super.key, required this.tweetId});

  @override
  ConsumerState<TweetDetailPage> createState() => _TweetDetailPageState();
}

class _TweetDetailPageState extends ConsumerState<TweetDetailPage> {
  final _replyController = TextEditingController();
  final _focusNode = FocusNode();

  @override
  void dispose() {
    _replyController.dispose();
    _focusNode.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final feedState = ref.watch(feedProvider);
    final tweet = feedState.tweets.where((t) => t.id == widget.tweetId).firstOrNull;

    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        backgroundColor: AppColors.bg,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AppColors.text),
          onPressed: () => context.pop(),
        ),
        title: const Text('推文', style: TextStyle(fontSize: 17, fontWeight: FontWeight.w700)),
      ),
      body: Column(
        children: [
          Expanded(
            child: tweet == null
                ? const Center(child: Text('推文不存在', style: TextStyle(color: AppColors.text2)))
                : ListView(
                    children: [
                      _TweetDetail(tweet: tweet, tweetId: widget.tweetId),
                      const Divider(color: AppColors.border, height: 1),
                      _ReplyStats(count: tweet.replies),
                      const Divider(color: AppColors.border, height: 1),
                      _ReplyThread(tweetId: widget.tweetId),
                    ],
                  ),
          ),
          _ReplyInput(
            controller: _replyController,
            focusNode: _focusNode,
            onSend: () => _handleReply(tweet),
          ),
        ],
      ),
    );
  }

  void _handleReply(Tweet? parentTweet) {
    if (_replyController.text.trim().isEmpty || parentTweet == null) return;

    final user = ref.read(currentUserProvider);
    if (user == null) return;

    final reply = Tweet(
      id: 'reply_${DateTime.now().millisecondsSinceEpoch}',
      userId: user.handle,
      name: user.name,
      handle: user.handle,
      verified: user.verified,
      text: _replyController.text.trim(),
      createdAt: DateTime.now(),
      avatar: user.name.substring(0, 1),
      avatarBg: user.avatarBg,
      likes: 0,
      retweets: 0,
      replies: 0,
      views: '0',
    );

    ref.read(feedProvider.notifier).addReply(widget.tweetId, reply);
    _replyController.clear();
    _focusNode.unfocus();
  }
}

class _TweetDetail extends ConsumerWidget {
  final Tweet tweet;
  final String tweetId;

  const _TweetDetail({required this.tweet, required this.tweetId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Container(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // 头像 + 名字行
          Row(
            children: [
              YanAvatar(avatar: tweet.avatar, avatarBg: tweet.avatarBg, size: 48, fontSize: 20),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Text(tweet.name, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16, color: AppColors.text)),
                        if (tweet.verified) const Padding(
                          padding: EdgeInsets.only(left: 4),
                          child: Icon(Icons.verified, size: 18, color: AppColors.accent),
                        ),
                      ],
                    ),
                    Text(tweet.handle, style: const TextStyle(fontSize: 15, color: AppColors.text2)),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          // 正文
          Text(tweet.text, style: const TextStyle(fontSize: 17, height: 1.5, color: AppColors.text)),
          const SizedBox(height: 12),
          // 时间
          Text(formatTime(tweet.createdAt), style: const TextStyle(fontSize: 15, color: AppColors.text2)),
          const SizedBox(height: 12),
          // 分割线
          Container(height: 1, color: AppColors.border),
          const SizedBox(height: 12),
          // 统计行
          Row(
            children: [
              _Stat(label: '转发', count: tweet.retweets, active: tweet.retweeted, color: AppColors.green),
              const SizedBox(width: 24),
              _Stat(label: '喜欢', count: tweet.likes, active: tweet.liked, color: AppColors.pink),
            ],
          ),
          const SizedBox(height: 12),
          // 互动栏
          Row(
            children: [
              _ActionBtn(icon: Icons.chat_bubble_outline, onTap: () {}),
              _ActionBtn(
                icon: Icons.repeat,
                onTap: () => ref.read(feedProvider.notifier).retweetTweet(tweetId),
                isActive: tweet.retweeted,
                activeColor: AppColors.green,
              ),
              _ActionBtn(
                icon: tweet.liked ? Icons.favorite : Icons.favorite_border,
                onTap: () => ref.read(feedProvider.notifier).likeTweet(tweetId),
                isActive: tweet.liked,
                activeColor: AppColors.pink,
              ),
              _ActionBtn(icon: Icons.share_outlined, onTap: () {}),
            ],
          ),
        ],
      ),
    );
  }
}

class _Stat extends StatelessWidget {
  final String label;
  final int count;
  final bool active;
  final Color color;

  const _Stat({required this.label, required this.count, this.active = false, required this.color});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Text('$count', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14, color: active ? color : AppColors.text)),
        const SizedBox(width: 4),
        Text(label, style: const TextStyle(fontSize: 14, color: AppColors.text2)),
      ],
    );
  }
}

class _ActionBtn extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;
  final bool isActive;
  final Color? activeColor;

  const _ActionBtn({required this.icon, required this.onTap, this.isActive = false, this.activeColor});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 8),
          child: Icon(icon, size: 20, color: isActive ? (activeColor ?? AppColors.text2) : AppColors.text2),
        ),
      ),
    );
  }
}

class _ReplyStats extends StatelessWidget {
  final int count;

  const _ReplyStats({required this.count});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Text(
        '$count 条回复',
        style: const TextStyle(fontSize: 15, color: AppColors.text2),
      ),
    );
  }
}

class _ReplyThread extends ConsumerWidget {
  final String tweetId;

  const _ReplyThread({required this.tweetId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final feedState = ref.watch(feedProvider);
    final replies = feedState.replies[tweetId] ?? [];

    if (replies.isEmpty) {
      return const Padding(
        padding: EdgeInsets.all(24),
        child: Center(
          child: Text('暂无回复', style: TextStyle(color: AppColors.text2, fontSize: 15)),
        ),
      );
    }

    return ListView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: replies.length,
      itemBuilder: (context, index) {
        final reply = replies[index];
        final isLast = index == replies.length - 1;
        return _ReplyItem(reply: reply, isLast: isLast, tweetId: tweetId);
      },
    );
  }
}

class _ReplyItem extends ConsumerWidget {
  final Tweet reply;
  final bool isLast;
  final String tweetId;

  const _ReplyItem({required this.reply, this.isLast = false, required this.tweetId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Container(
      padding: const EdgeInsets.only(left: 16, right: 16, top: 12),
      decoration: const BoxDecoration(
        border: Border(
          left: BorderSide(color: AppColors.border, width: 2),
        ),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // 连接线
          Container(
            width: 2,
            height: isLast ? 24 : double.infinity,
            margin: const EdgeInsets.only(left: 8),
            color: AppColors.border,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    YanAvatar(avatar: reply.avatar, avatarBg: reply.avatarBg, size: 36, fontSize: 14),
                    const SizedBox(width: 8),
                    Text(reply.name, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14, color: AppColors.text)),
                    if (reply.verified) const Padding(
                      padding: EdgeInsets.only(left: 2),
                      child: Icon(Icons.verified, size: 14, color: AppColors.accent),
                    ),
                    const SizedBox(width: 4),
                    Text('${reply.handle} · ${formatTime(reply.createdAt)}', style: const TextStyle(fontSize: 14, color: AppColors.text2)),
                  ],
                ),
                const SizedBox(height: 4),
                Text(reply.text, style: const TextStyle(fontSize: 15, height: 1.4, color: AppColors.text)),
                const SizedBox(height: 8),
                // 回复互动栏
                Row(
                  children: [
                    _ReplyAction(icon: Icons.chat_bubble_outline, count: reply.replies, onTap: () {}),
                    _ReplyAction(
                      icon: Icons.repeat,
                      count: reply.retweets,
                      onTap: () => ref.read(feedProvider.notifier).retweetTweet(reply.id),
                      isActive: reply.retweeted,
                      color: AppColors.green,
                    ),
                    _ReplyAction(
                      icon: reply.liked ? Icons.favorite : Icons.favorite_border,
                      count: reply.likes,
                      onTap: () => ref.read(feedProvider.notifier).likeTweet(reply.id),
                      isActive: reply.liked,
                      color: AppColors.pink,
                    ),
                  ],
                ),
                if (!isLast) const SizedBox(height: 12),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _ReplyAction extends StatelessWidget {
  final IconData icon;
  final int count;
  final VoidCallback onTap;
  final bool isActive;
  final Color? color;

  const _ReplyAction({required this.icon, required this.count, required this.onTap, this.isActive = false, Color? color})
      : color = color ?? AppColors.text2;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Row(
        children: [
          InkWell(
            onTap: onTap,
            borderRadius: BorderRadius.circular(4),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
              child: Icon(icon, size: 16, color: isActive ? color : AppColors.text2),
            ),
          ),
          if (count > 0) ...[
            const SizedBox(width: 2),
            Text('$count', style: TextStyle(fontSize: 13, color: isActive ? color : AppColors.text2)),
          ],
        ],
      ),
    );
  }
}

class _ReplyInput extends StatelessWidget {
  final TextEditingController controller;
  final FocusNode focusNode;
  final VoidCallback onSend;

  const _ReplyInput({required this.controller, required this.focusNode, required this.onSend});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: const BoxDecoration(
        color: AppColors.bg,
        border: Border(top: BorderSide(color: AppColors.border, width: 0.5)),
      ),
      child: Row(
        children: [
          Expanded(
            child: TextField(
              controller: controller,
              focusNode: focusNode,
              maxLines: 3,
              minLines: 1,
              style: const TextStyle(fontSize: 16, color: AppColors.text),
              decoration: const InputDecoration(
                hintText: '回复...',
                hintStyle: TextStyle(color: AppColors.text2, fontSize: 16),
                border: InputBorder.none,
                contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                filled: true,
                fillColor: AppColors.bg2,
              ),
            ),
          ),
          const SizedBox(width: 8),
          IconButton(
            icon: const Icon(Icons.send, color: AppColors.accent),
            onPressed: onSend,
          ),
        ],
      ),
    );
  }
}