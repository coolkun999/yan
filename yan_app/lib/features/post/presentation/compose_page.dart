import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/yan_widgets.dart';
import '../../../core/constants/app_constants.dart';
import '../../auth/presentation/auth_provider.dart';
import '../../feed/presentation/feed_provider.dart';
import '../../feed/domain/tweet.dart';

/// 发帖页
class ComposePage extends ConsumerStatefulWidget {
  const ComposePage({super.key});

  @override
  ConsumerState<ComposePage> createState() => _ComposePageState();
}

class _ComposePageState extends ConsumerState<ComposePage> {
  final _controller = TextEditingController();
  final _focusNode = FocusNode();
  final _imagePicker = ImagePicker();
  final List<String> _selectedImages = [];
  int _charCount = 0;
  final int _maxChars = AppConstants.maxPostLength;
  bool _isPosting = false;

  @override
  void initState() {
    super.initState();
    _controller.addListener(_onTextChanged);
    _focusNode.requestFocus();
  }

  @override
  void dispose() {
    _controller.dispose();
    _focusNode.dispose();
    super.dispose();
  }

  void _onTextChanged() {
    setState(() => _charCount = _controller.text.length);
  }

  bool get _canPost => (_controller.text.trim().isNotEmpty || _selectedImages.isNotEmpty) && _charCount <= _maxChars && !_isPosting;

  Color get _counterColor {
    final remaining = _maxChars - _charCount;
    if (remaining < 0) return const Color(0xFFF4212E);
    if (remaining < 50) return const Color(0xFFF7A11C);
    return AppColors.text2;
  }

  Future<void> _pickImage() async {
    try {
      final XFile? image = await _imagePicker.pickImage(source: ImageSource.gallery, imageQuality: 80);
      if (image != null) {
        setState(() => _selectedImages.add(image.path));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('选择图片失败: $e'), backgroundColor: AppColors.bg3),
        );
      }
    }
  }

  void _removeImage(int index) {
    setState(() => _selectedImages.removeAt(index));
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(currentUserProvider);

    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        backgroundColor: AppColors.bg,
        leading: IconButton(
          icon: const Icon(Icons.close, color: AppColors.text),
          onPressed: () => context.pop(),
        ),
        title: const Text('发帖', style: TextStyle(fontSize: 17, fontWeight: FontWeight.w700)),
        actions: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
            child: ElevatedButton(
              onPressed: _canPost ? _handlePost : null,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.text,
                foregroundColor: AppColors.bg,
                disabledBackgroundColor: AppColors.text2.withOpacity(0.3),
                disabledForegroundColor: AppColors.text2,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(9999)),
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              ),
              child: _isPosting
                  ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))
                  : const Text('发帖', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700)),
            ),
          ),
        ],
      ),
      body: Column(
        children: [
          // 输入区
          Expanded(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // 头像
                  YanAvatar(
                    avatar: user?.name.substring(0, 1) ?? '?',
                    avatarBg: user?.avatarBg ?? 'linear-gradient(135deg,#667eea,#764ba2)',
                    size: 40,
                    fontSize: 16,
                  ),
                  const SizedBox(width: 12),
                  // 文本输入
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        TextField(
                          controller: _controller,
                          focusNode: _focusNode,
                          maxLength: _maxChars,
                          maxLines: null,
                          style: const TextStyle(fontSize: 18, color: AppColors.text, height: 1.5),
                          decoration: const InputDecoration(
                            hintText: '有什么新鲜事？',
                            hintStyle: TextStyle(color: AppColors.text2, fontSize: 18),
                            border: InputBorder.none,
                            counterText: '',
                          ),
                        ),
                        // 图片预览
                        if (_selectedImages.isNotEmpty)
                          SizedBox(
                            height: 100,
                            child: ListView.builder(
                              scrollDirection: Axis.horizontal,
                              itemCount: _selectedImages.length,
                              itemBuilder: (context, index) {
                                return Stack(
                                  children: [
                                    Container(
                                      margin: const EdgeInsets.only(right: 8, top: 8),
                                      width: 100,
                                      height: 100,
                                      decoration: BoxDecoration(
                                        borderRadius: BorderRadius.circular(12),
                                        color: AppColors.bg2,
                                      ),
                                      child: ClipRRect(
                                        borderRadius: BorderRadius.circular(12),
                                        child: Image.asset(
                                          _selectedImages[index],
                                          fit: BoxFit.cover,
                                          errorBuilder: (_, __, ___) => const Center(
                                            child: Icon(Icons.image, color: AppColors.text2, size: 32),
                                          ),
                                        ),
                                      ),
                                    ),
                                    Positioned(
                                      top: 4,
                                      right: 12,
                                      child: GestureDetector(
                                        onTap: () => _removeImage(index),
                                        child: Container(
                                          width: 20,
                                          height: 20,
                                          decoration: const BoxDecoration(color: Color(0xFFF4212E), shape: BoxShape.circle),
                                          child: const Icon(Icons.close, size: 14, color: Colors.white),
                                        ),
                                      ),
                                    ),
                                  ],
                                );
                              },
                            ),
                          ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
          // 分割线
          Container(height: 0.5, color: AppColors.border),
          // 工具栏 + 字符计数
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
            child: Row(
              children: [
                // 媒体按钮
                _ToolbarButton(
                  icon: Icons.image_outlined,
                  onTap: _pickImage,
                  color: AppColors.accent,
                ),
                _ToolbarButton(
                  icon: Icons.gif_box_outlined,
                  onTap: () {},
                  color: AppColors.accent,
                ),
                _ToolbarButton(
                  icon: Icons.poll_outlined,
                  onTap: () {},
                  color: AppColors.accent,
                ),
                _ToolbarButton(
                  icon: Icons.emoji_emotions_outlined,
                  onTap: () {},
                  color: AppColors.accent,
                ),
                _ToolbarButton(
                  icon: Icons.location_on_outlined,
                  onTap: () {},
                  color: AppColors.accent,
                ),
                _ToolbarButton(
                  icon: Icons.calendar_today_outlined,
                  onTap: () {},
                  color: AppColors.accent,
                ),
                const Spacer(),
                // 字符计数器
                if (_charCount > 0) ...[
                  Container(
                    width: 24,
                    height: 24,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(
                        color: _counterColor,
                        width: 2,
                      ),
                    ),
                    child: Center(
                      child: Text(
                        '${_maxChars - _charCount}',
                        style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: _counterColor),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _handlePost() async {
    if (!_canPost) return;

    setState(() => _isPosting = true);

    final user = ref.read(currentUserProvider);
    if (user == null) {
      setState(() => _isPosting = false);
      return;
    }

    final tweet = Tweet(
      id: 't_${DateTime.now().millisecondsSinceEpoch}',
      userId: user.handle,
      name: user.name,
      handle: user.handle,
      verified: user.verified,
      text: _controller.text.trim(),
      createdAt: DateTime.now(),
      avatar: user.name.substring(0, 1),
      avatarBg: user.avatarBg,
      likes: 0,
      retweets: 0,
      replies: 0,
      views: '0',
    );

    ref.read(feedProvider.notifier).addTweet(tweet);

    await Future.delayed(const Duration(milliseconds: 300));
    if (mounted) context.pop();
  }
}

class _ToolbarButton extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;
  final Color color;

  const _ToolbarButton({required this.icon, required this.onTap, required this.color});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(9999),
      child: Padding(
        padding: const EdgeInsets.all(8),
        child: Icon(icon, size: 22, color: color),
      ),
    );
  }
}