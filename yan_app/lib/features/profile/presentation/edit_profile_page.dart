import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/yan_widgets.dart';
import '../../auth/presentation/auth_provider.dart';

/// 编辑资料页
class EditProfilePage extends ConsumerStatefulWidget {
  const EditProfilePage({super.key});

  @override
  ConsumerState<EditProfilePage> createState() => _EditProfilePageState();
}

class _EditProfilePageState extends ConsumerState<EditProfilePage> {
  late TextEditingController _nameController;
  late TextEditingController _bioController;
  late TextEditingController _locationController;
  late TextEditingController _websiteController;

  @override
  void initState() {
    super.initState();
    final user = ref.read(currentUserProvider);
    _nameController = TextEditingController(text: user?.name ?? '');
    _bioController = TextEditingController(text: user?.bio ?? '');
    _locationController = TextEditingController(text: user?.location ?? '');
    _websiteController = TextEditingController(text: user?.website ?? '');
  }

  @override
  void dispose() {
    _nameController.dispose();
    _bioController.dispose();
    _locationController.dispose();
    _websiteController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        backgroundColor: AppColors.bg,
        leading: IconButton(
          icon: const Icon(Icons.close, color: AppColors.text),
          onPressed: () => context.pop(),
        ),
        title: const Text('编辑资料', style: TextStyle(fontSize: 17, fontWeight: FontWeight.w700)),
        actions: [
          Container(
            margin: const EdgeInsets.only(right: 8),
            child: TextButton(
              onPressed: _saveProfile,
              child: const Text('保存', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: AppColors.text)),
            ),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.symmetric(vertical: 16),
        children: [
          // 头像区
          Center(
            child: Stack(
              children: [
                Consumer(
                  builder: (context, ref, _) {
                    final user = ref.watch(currentUserProvider);
                    return YanAvatar(
                      avatar: user?.name.substring(0, 1) ?? '?',
                      avatarBg: user?.avatarBg ?? 'linear-gradient(135deg,#667eea,#764ba2)',
                      size: 80,
                      fontSize: 32,
                    );
                  },
                ),
                Positioned(
                  right: 0,
                  bottom: 0,
                  child: Container(
                    width: 28,
                    height: 28,
                    decoration: BoxDecoration(
                      color: AppColors.accent,
                      shape: BoxShape.circle,
                      border: Border.all(color: AppColors.bg, width: 3),
                    ),
                    child: const Icon(Icons.camera_alt, size: 14, color: Colors.white),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          // 名字
          _InputField(label: '名字', controller: _nameController, maxLength: 50),
          const Divider(color: AppColors.border, height: 1),
          // 简介
          _InputField(label: '简介', controller: _bioController, maxLength: 160, maxLines: 3),
          const Divider(color: AppColors.border, height: 1),
          // 位置
          _InputField(label: '位置', controller: _locationController, maxLength: 100),
          const Divider(color: AppColors.border, height: 1),
          // 网站
          _InputField(label: '网站', controller: _websiteController, maxLength: 100),
          const SizedBox(height: 24),
          // 封面
          Container(
            margin: const EdgeInsets.symmetric(horizontal: 16),
            height: 100,
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF1D9BF0), Color(0xFFF5576C), Color(0xFFA855F7)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Stack(
              children: [
                Positioned(
                  right: 8,
                  bottom: 8,
                  child: Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: Colors.black.withOpacity(0.3),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Icon(Icons.camera_alt, size: 18, color: Colors.white),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          // 生日（固定显示）
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('生日', style: TextStyle(fontSize: 14, color: AppColors.text2)),
                const SizedBox(height: 8),
                Text(
                  '1990年1月1日',
                  style: const TextStyle(fontSize: 17, color: AppColors.text),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  void _saveProfile() {
    // 保存逻辑
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('资料已保存'),
        backgroundColor: AppColors.bg3,
      ),
    );
    context.pop();
  }
}

class _InputField extends StatelessWidget {
  final String label;
  final TextEditingController controller;
  final int maxLength;
  final int maxLines;

  const _InputField({
    required this.label,
    required this.controller,
    this.maxLength = 100,
    this.maxLines = 1,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text(label, style: const TextStyle(fontSize: 14, color: AppColors.text2)),
              const Spacer(),
              Text(
                '${controller.text.length}/$maxLength',
                style: const TextStyle(fontSize: 14, color: AppColors.text2),
              ),
            ],
          ),
          const SizedBox(height: 8),
          TextField(
            controller: controller,
            maxLength: maxLength,
            maxLines: maxLines,
            style: const TextStyle(fontSize: 17, color: AppColors.text),
            decoration: const InputDecoration(
              border: InputBorder.none,
              counterText: '',
              contentPadding: EdgeInsets.zero,
            ),
          ),
        ],
      ),
    );
  }
}