import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../constants/app_constants.dart';

/// 圆形头像组件
class YanAvatar extends StatelessWidget {
  final String? avatar;       // 头像 URL 或首字符
  final String avatarBg;      // 渐变背景字符串
  final double size;
  final double fontSize;
  final VoidCallback? onTap;

  const YanAvatar({
    super.key,
    this.avatar,
    required this.avatarBg,
    this.size = 40,
    this.fontSize = 16,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final isGradient = avatarBg.startsWith('linear-gradient');
    final isUrl = avatar != null && (avatar!.startsWith('http') || avatar!.startsWith('data:'));

    Widget child;
    if (isUrl) {
      child = Image.network(
        avatar!,
        width: size,
        height: size,
        fit: BoxFit.cover,
        errorBuilder: (_, __, ___) => _buildTextAvatar(),
      );
    } else {
      child = _buildTextAvatar();
    }

    Widget avatarWidget = Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        gradient: isGradient ? _parseGradient(avatarBg) : null,
        color: isGradient ? null : AppColors.bg3,
      ),
      child: Center(child: child),
    );

    if (onTap != null) {
      avatarWidget = GestureDetector(onTap: onTap, child: avatarWidget);
    }

    return avatarWidget;
  }

  Widget _buildTextAvatar() {
    final text = (avatar?.isNotEmpty == true) ? avatar!.substring(0, 1) : '?';
    return Text(
      text,
      style: TextStyle(
        color: Colors.white,
        fontSize: fontSize,
        fontWeight: FontWeight.w700,
      ),
    );
  }

  LinearGradient _parseGradient(String gradientStr) {
    // 简单解析 linear-gradient(135deg,#color1,#color2)
    final regex = RegExp(r'#([0-9a-fA-F]{6})');
    final matches = regex.allMatches(gradientStr).toList();
    if (matches.length >= 2) {
      final c1 = Color(int.parse('${matches[0].group(1)}', radix: 16) + 0xFF000000);
      final c2 = Color(int.parse('${matches[1].group(1)}', radix: 16) + 0xFF000000);
      return LinearGradient(
        colors: [c1, c2],
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
      );
    }
    return const LinearGradient(colors: [AppColors.bg3, AppColors.bg4]);
  }
}

/// 大号渐变背景容器（用于 cover 图等）
class YanGradientBox extends StatelessWidget {
  final List<Color> colors;
  final double height;
  final BorderRadius? borderRadius;
  final Widget? child;

  const YanGradientBox({
    super.key,
    required this.colors,
    this.height = 200,
    this.borderRadius,
    this.child,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      height: height,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: colors,
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: borderRadius,
      ),
      child: child,
    );
  }
}

/// 数字格式化（1234 -> 1.2k, 12345 -> 1.2万）
String formatCount(int count) {
  if (count >= 10000) return '${(count / 10000).toStringAsFixed(1)}万';
  if (count >= 1000) return '${(count / 1000).toStringAsFixed(1)}k';
  return count.toString();
}

/// 相对时间格式化
String formatTime(DateTime createdAt) {
  final now = DateTime.now();
  final diff = now.difference(createdAt);

  if (diff.inMinutes < 1) return '刚刚';
  if (diff.inMinutes < 60) return '${diff.inMinutes}分钟前';
  if (diff.inHours < 24) return '${diff.inHours}小时前';
  if (diff.inDays < 7) return '${diff.inDays}天前';

  return '${createdAt.month}月${createdAt.day}日';
}

/// 互动按钮（回复/转帖/点赞/书签）
class YanActionButton extends StatelessWidget {
  final IconData icon;
  final int count;
  final bool isActive;
  final Color activeColor;
  final VoidCallback onTap;

  const YanActionButton({
    super.key,
    required this.icon,
    required this.count,
    this.isActive = false,
    this.activeColor = AppColors.text2,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(AppConstants.borderRadiusPill),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              icon,
              size: 18,
              color: isActive ? activeColor : AppColors.text2,
            ),
            const SizedBox(width: 4),
            Text(
              formatCount(count),
              style: TextStyle(
                fontSize: 13,
                color: isActive ? activeColor : AppColors.text2,
              ),
            ),
          ],
        ),
      ),
    );
  }
}