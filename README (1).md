# FOCUS NEXUS MVP

> 🧠 ADHD-friendly productivity app with science-based focus techniques

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)

## 🎯 Overview

FOCUS NEXUS is an evidence-based productivity application specifically designed for individuals with ADHD. It combines scientifically validated techniques to enhance focus, reduce decision fatigue, and build sustainable productivity habits.

### 🔬 Scientific Foundation

- **If-Then Planning**: Implementation intentions with d≈0.65 effect size (Gollwitzer & Sheeran, 2006)
- **Pomodoro Technique**: 25-minute focus sessions optimized for ADHD attention spans
- **Ambient Noise**: White/pink noise for cognitive enhancement and distraction reduction
- **Immediate Feedback**: Gamification elements based on operant conditioning principles

## ✨ Core Features

### 🎯 If-Then Planning Templates
- **Evidence-based templates** for common ADHD challenges
- **Custom plan creation** with scientific guidance
- **Trigger tracking** to measure implementation success
- **Categories**: Time, location, emotional, social triggers

### ⏱️ ADHD-Optimized Pomodoro Timer
- **25/5 minute intervals** (focus/micro-break)
- **Visual circular progress** with smooth animations
- **Automatic phase transitions** to reduce cognitive load
- **Session tracking** and completion rewards

### 🌊 Focus Noise Generator
- **White noise**: Consistent frequency masking
- **Pink noise**: 1/f natural sound characteristics  
- **Web Audio API** implementation
- **Safety volume limits** (max 50%)
- **Scientific explanations** for each noise type

### 🎮 Lightweight Gamification
- **Point system** for completed sessions
- **Achievement badges** for milestones
- **Level progression** without overwhelming complexity
- **Immediate rewards** to support dopamine regulation

## 🛠️ Technical Architecture

### Frontend Stack
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for utility-first styling
- **Framer Motion** for smooth animations
- **Zustand** for state management with persistence

### Backend & Database
- **Supabase** (PostgreSQL + Auth + Real-time)
- **Row Level Security (RLS)** for data isolation
- **Anonymous authentication** for privacy
- **Timezone-safe statistics** with since-wake calculations

### Progressive Web App (PWA)
- **Service Worker** with Workbox
- **App shortcuts** for quick actions
- **Offline capability** for core features
- **Install prompts** for native-like experience

### Audio Technology
- **Web Audio API** for noise generation
- **Real-time audio processing** (white/pink noise)
- **Safety-first design** with volume restrictions
- **User interaction requirements** (autoplay policies)

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd focus-nexus-mvp
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
   ```bash
   # Copy environment template
   cp .env.example .env

   # Edit .env with your Supabase credentials
   VITE_SUPABASE_URL=your-project-url
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

4. **Initialize database**
   ```sql
   -- Run the SQL in database/schema.sql in your Supabase SQL editor
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

## 📁 Project Structure

```
focus-nexus-mvp/
├── database/
│   └── schema.sql              # Complete database schema with RLS
├── public/
│   ├── manifest.webmanifest    # PWA configuration
│   └── icons/                  # App icons (placeholder)
├── src/
│   ├── components/
│   │   ├── Dashboard.tsx       # Main overview with auth
│   │   ├── FocusTimer.tsx      # Pomodoro timer implementation
│   │   ├── IfThenPlanner.tsx   # Evidence-based planning tool
│   │   └── NoisePlayer.tsx     # Web Audio noise generator
│   ├── stores/
│   │   └── app.ts              # Zustand store with persistence
│   ├── types/
│   │   └── index.ts            # TypeScript type definitions
│   ├── utils/
│   │   └── supabase.ts         # Database client configuration
│   ├── App.tsx                 # Main app with tab navigation
│   ├── main.tsx               # React entry point
│   └── index.css              # Tailwind + custom styles
├── package.json               # Dependencies and scripts
├── vite.config.ts            # Vite + PWA configuration
└── tailwind.config.js        # Tailwind customization
```

## 🎨 Design Philosophy

### ADHD-Friendly UX Principles
1. **Reduce Decision Fatigue**: Clear visual hierarchy and limited options
2. **Immediate Feedback**: Instant responses to user actions
3. **Progress Visibility**: Clear indication of achievements and progress
4. **Error Prevention**: Safety guards and confirmation dialogs
5. **Customization**: Adaptable to individual ADHD presentation

### Accessibility Features
- **High contrast** color schemes
- **Focus indicators** for keyboard navigation
- **Screen reader** compatible structure
- **Reduced motion** options (planned)
- **Clear typography** with sufficient spacing

## 📊 Evidence Base

### If-Then Planning Research
- Gollwitzer, P. M., & Sheeran, P. (2006). Implementation intentions and goal achievement: A meta‐analysis of effects and processes. *Advances in Experimental Social Psychology*, 38, 69-119.
- **Effect size**: d = 0.65 (medium to large effect)
- **Success rate**: ~2x improvement in goal achievement

### ADHD-Specific Considerations
- **Executive function support** through external structure
- **Working memory assistance** via externalization
- **Dopamine system optimization** through immediate rewards
- **Attention regulation** via environmental modifications

## 🔒 Privacy & Security

### Data Protection
- **Anonymous authentication** - no personal information required
- **Local-first approach** with optional cloud sync
- **Row Level Security** ensures user data isolation
- **No tracking** or analytics beyond essential app functions

### Security Features
- **Environment variable protection** for sensitive keys
- **Input validation** on all user inputs
- **Rate limiting** on API calls (Supabase built-in)
- **HTTPS enforcement** in production

## 🧪 A/B Testing Preparation

The application is structured to support future A/B testing:
- **Feature flags** ready for implementation
- **Event tracking** system for behavioral analytics
- **Modular components** for easy variation testing
- **Metadata collection** for effectiveness measurement

## 📈 Roadmap

### Phase 1: MVP (Current)
- [x] Core If-Then planning functionality
- [x] Pomodoro timer with ADHD optimizations
- [x] White/pink noise generator
- [x] Basic gamification system
- [x] PWA capabilities

### Phase 2: Enhancement
- [ ] Chart.js time-scale analytics
- [ ] Advanced badge system
- [ ] Export capabilities (CSV/JSON)
- [ ] Customizable timer durations
- [ ] Dark mode support

### Phase 3: Advanced Features
- [ ] Habit tracking integration
- [ ] Calendar synchronization
- [ ] Team/family sharing features
- [ ] AI-powered plan suggestions
- [ ] Wearable device integration

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines for:
- Code style and conventions
- Testing requirements  
- Documentation standards
- Issue reporting process

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Research teams studying ADHD and executive function
- Open source community for excellent tools and libraries
- ADHD community for feedback and validation
- Accessibility advocates for inclusive design principles

## 📞 Support

- **Issues**: GitHub Issues for bug reports and feature requests
- **Documentation**: Comprehensive inline comments and type definitions
- **Community**: Discussions for questions and suggestions

---

**Made with ❤️ for the ADHD community**
