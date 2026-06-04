import 'package:flutter/material.dart';

/// 头像渐变背景预设（8种）
class AvatarGradients {
  AvatarGradients._();

  static const List<String> gradients = [
    'linear-gradient(135deg,#667eea,#764ba2)',
    'linear-gradient(135deg,#f093fb,#f5576c)',
    'linear-gradient(135deg,#4facfe,#00f2fe)',
    'linear-gradient(135deg,#43e97b,#38f9d7)',
    'linear-gradient(135deg,#fa709a,#fee140)',
    'linear-gradient(135deg,#a18cd1,#fbc2eb)',
    'linear-gradient(135deg,#fccb90,#d57eeb)',
    'linear-gradient(135deg,#e0c3fc,#8ec5fc)',
  ];

  static const List<List<Color>> gradientColors = [
    [Color(0xFF667EEA), Color(0xFF764BA2)],
    [Color(0xFFF093FB), Color(0xFFF5576C)],
    [Color(0xFF4FACFE), Color(0xFF00F2FE)],
    [Color(0xFF43E97B), Color(0xFF38F9D7)],
    [Color(0xFFFA709A), Color(0xFFFEE140)],
    [Color(0xFFA18CD1), Color(0xFFFBC2EB)],
    [Color(0xFFFCCB90), Color(0xFFD57EEB)],
    [Color(0xFFE0C3FC), Color(0xFF8EC5FC)],
  ];

  static List<Color> getGradient(int index) {
    return gradientColors[index % gradientColors.length];
  }

  static String getGradientString(int index) {
    return gradients[index % gradients.length];
  }
}

/// 封面渐变预设
class CoverGradients {
  CoverGradients._();

  static const List<String> gradients = [
    'linear-gradient(135deg,#1d9bf0,#f5576c,#a855f7)',
    'linear-gradient(135deg,#667eea,#764ba2)',
    'linear-gradient(135deg,#f093fb,#f5576c)',
    'linear-gradient(135deg,#4facfe,#00f2fe)',
    'linear-gradient(135deg,#43e97b,#38f9d7)',
    'linear-gradient(135deg,#fa709a,#fee140)',
    'linear-gradient(135deg,#a18cd1,#fbc2eb)',
    'linear-gradient(135deg,#fccb90,#d57eeb)',
  ];

  static const List<List<Color>> gradientColors = [
    [Color(0xFF1D9BF0), Color(0xFFF5576C), Color(0xFFA855F7)],
    [Color(0xFF667EEA), Color(0xFF764BA2)],
    [Color(0xFFF093FB), Color(0xFFF5576C)],
    [Color(0xFF4FACFE), Color(0xFF00F2FE)],
    [Color(0xFF43E97B), Color(0xFF38F9D7)],
    [Color(0xFFFA709A), Color(0xFFFEE140)],
    [Color(0xFFA18CD1), Color(0xFFFBC2EB)],
    [Color(0xFFFCCB90), Color(0xFFD57EEB)],
  ];

  static List<Color> getGradient(int index) {
    return gradientColors[index % gradientColors.length];
  }
}

/// 应用常量
class AppConstants {
  AppConstants._();

  static const int maxPostLength = 500;
  static const int tweetPageSize = 8;
  static const int notifPageSize = 10;
  static const int explorePageSize = 15;

  static const Duration animationDuration = Duration(milliseconds: 200);
  static const Duration toastDuration = Duration(milliseconds: 1500);

  static const double borderRadiusPill = 9999;
  static const double borderRadiusCard = 16;
  static const double borderRadiusInput = 12;

  static const double sidebarWidth = 275;
  static const double sidebarRightWidth = 350;
  static const double mainContentMaxWidth = 600;
}