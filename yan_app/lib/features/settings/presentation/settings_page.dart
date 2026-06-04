import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../auth/presentation/auth_provider.dart';

/// 设置状态
class SettingsState {
  final String theme; // 'dark' | 'light' | 'dim'

  const SettingsState({this.theme = 'dark'});

  SettingsState copyWith({String? theme}) {
    return SettingsState(theme: theme ?? this.theme);
  }
}

class SettingsNotifier extends StateNotifier<SettingsState> {
  SettingsNotifier() : super(const SettingsState());

  void setTheme(String theme) {
    state = state.copyWith(theme: theme);
  }
}

final settingsProvider = StateNotifierProvider<SettingsNotifier, SettingsState>((ref) {
  return SettingsNotifier();
});

/// 设置页
class SettingsPage extends ConsumerWidget {
  const SettingsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final settingsState = ref.watch(settingsProvider);

    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        backgroundColor: AppColors.bg,
        title: const Text('设置', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800)),
      ),
      body: ListView(
        children: [
          _SectionHeader(title: '主题'),
          _ThemeOption(
            label: '深色',
            icon: Icons.dark_mode,
            isSelected: settingsState.theme == 'dark',
            onTap: () => ref.read(settingsProvider.notifier).setTheme('dark'),
          ),
          _ThemeOption(
            label: '浅色',
            icon: Icons.light_mode,
            isSelected: settingsState.theme == 'light',
            onTap: () => ref.read(settingsProvider.notifier).setTheme('light'),
          ),
          _ThemeOption(
            label: '深灰',
            icon: Icons.contrast,
            isSelected: settingsState.theme == 'dim',
            onTap: () => ref.read(settingsProvider.notifier).setTheme('dim'),
          ),
          _SectionHeader(title: '账户'),
          _SettingsItem(
            label: '编辑资料',
            icon: Icons.person_outline,
            onTap: () {},
          ),
          _SettingsItem(
            label: '隐私与安全',
            icon: Icons.shield_outlined,
            onTap: () {},
          ),
          _SettingsItem(
            label: '通知偏好',
            icon: Icons.notifications_outlined,
            onTap: () {},
          ),
          _SettingsItem(
            label: '关于',
            icon: Icons.info_outline,
            onTap: () => _showAboutDialog(context),
          ),
          const SizedBox(height: 24),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: OutlinedButton(
              onPressed: () => _handleLogout(context, ref),
              style: OutlinedButton.styleFrom(
                foregroundColor: const Color(0xFFF4212E),
                side: const BorderSide(color: Color(0xFFF4212E)),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(9999)),
                padding: const EdgeInsets.symmetric(vertical: 12),
              ),
              child: const Text('退出登录', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
            ),
          ),
          const SizedBox(height: 32),
        ],
      ),
    );
  }

  void _handleLogout(BuildContext context, WidgetRef ref) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.bg2,
        title: const Text('退出登录', style: TextStyle(color: AppColors.text)),
        content: const Text('确定要退出当前账号吗？', style: TextStyle(color: AppColors.text2)),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('取消', style: TextStyle(color: AppColors.text2)),
          ),
          TextButton(
            onPressed: () {
              ref.read(authProvider.notifier).logout();
              Navigator.pop(ctx);
              context.go('/login');
            },
            child: const Text('退出', style: TextStyle(color: Color(0xFFF4212E))),
          ),
        ],
      ),
    );
  }

  void _showAboutDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.bg2,
        title: const Row(
          children: [
            Text('言', style: TextStyle(fontSize: 24, fontWeight: FontWeight.w900, color: AppColors.accent)),
            SizedBox(width: 8),
            Text('v1.0.0', style: TextStyle(fontSize: 16, color: AppColors.text2)),
          ],
        ),
        content: const Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('中国版 X/Twitter 风格社交平台', style: TextStyle(color: AppColors.text, fontSize: 15)),
            SizedBox(height: 12),
            Text('使用 Flutter + Riverpod 构建', style: TextStyle(color: AppColors.text2, fontSize: 13)),
            SizedBox(height: 4),
            Text('© 2026 言 All rights reserved.', style: TextStyle(color: AppColors.text2, fontSize: 13)),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('关闭', style: TextStyle(color: AppColors.accent)),
          ),
        ],
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  final String title;

  const _SectionHeader({required this.title});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 24, 16, 8),
      child: Text(
        title.toUpperCase(),
        style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: AppColors.text2, letterSpacing: 1),
      ),
    );
  }
}

class _ThemeOption extends StatelessWidget {
  final String label;
  final IconData icon;
  final bool isSelected;
  final VoidCallback onTap;

  const _ThemeOption({required this.label, required this.icon, required this.isSelected, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: const BoxDecoration(
          border: Border(bottom: BorderSide(color: AppColors.border, width: 0.5)),
        ),
        child: Row(
          children: [
            Icon(icon, size: 22, color: AppColors.text),
            const SizedBox(width: 16),
            Text(label, style: const TextStyle(fontSize: 17, color: AppColors.text)),
            const Spacer(),
            if (isSelected)
              const Icon(Icons.check, size: 22, color: AppColors.accent),
          ],
        ),
      ),
    );
  }
}

class _SettingsItem extends StatelessWidget {
  final String label;
  final IconData icon;
  final VoidCallback onTap;

  const _SettingsItem({required this.label, required this.icon, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: const BoxDecoration(
          border: Border(bottom: BorderSide(color: AppColors.border, width: 0.5)),
        ),
        child: Row(
          children: [
            Icon(icon, size: 22, color: AppColors.text),
            const SizedBox(width: 16),
            Text(label, style: const TextStyle(fontSize: 17, color: AppColors.text)),
            const Spacer(),
            const Icon(Icons.chevron_right, size: 22, color: AppColors.text2),
          ],
        ),
      ),
    );
  }
}