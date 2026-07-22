import { Link } from 'react-router-dom';
import {
  Briefcase, BookOpen, DollarSign, AlertTriangle, Crown,
  Sparkles, ArrowRight, CheckCircle, Star, Zap, Target, Users,
} from 'lucide-react';

const agents = [
  { icon: Briefcase, name: '职业规划专家', desc: '分析职业定位、优势短板、发展路线', color: 'from-blue-500 to-cyan-500' },
  { icon: BookOpen, name: '学习成长导师', desc: '制定学习计划、技能差距分析、资源推荐', color: 'from-emerald-500 to-teal-500' },
  { icon: DollarSign, name: '财务规划专家', desc: '收入增长路径、副业方向、商业化建议', color: 'from-amber-500 to-orange-500' },
  { icon: AlertTriangle, name: '风险挑战专家', desc: '反方角色，审查漏洞、指出风险、质疑假设', color: 'from-rose-500 to-pink-500' },
  { icon: Crown, name: '人生总规划师', desc: '综合所有意见，生成最终五年成长报告', color: 'from-slate-600 to-slate-800' },
];

const features = [
  { icon: Zap, title: '百万级上下文', desc: '综合分析简历、笔记、项目经历等多份资料', color: 'from-blue-500 to-cyan-500' },
  { icon: Users, title: '5位专家协作', desc: '多视角分析，反方质疑后综合，避免单一偏见', color: 'from-emerald-500 to-teal-500' },
  { icon: Target, title: '可执行计划', desc: '五年路线图 + 12月行动计划 + 每日执行指南', color: 'from-amber-500 to-orange-500' },
  { icon: Sparkles, title: '实时进度', desc: '观看AI专家一步步分析，过程透明可见', color: 'from-rose-500 to-pink-500' },
];

export default function HomePage() {
  return (
    <div className="space-y-16 slide-up">
      {/* Hero Section */}
      <section className="text-center py-16 fade-in">
        <div className="neu-tag mb-8 mx-auto w-fit">
          <Sparkles className="w-4 h-4 text-neu-primary" />
          <span className="font-medium">基于 Seed Evolving 大模型</span>
        </div>

        <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight tracking-tight">
          <span className="gradient-text">AI 多专家协同</span>
          <br />
          定制你的五年成长规划
        </h1>

        <p className="text-base md:text-lg text-neu-secondary max-w-2xl mx-auto mb-10 leading-relaxed">
          5 位 AI 专家从职业、学习、财务、风险多角度分析，
          <br className="hidden md:block" />
          经过独立分析、反方质疑、综合决策，生成可执行的人生规划
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/profile" className="neu-btn-primary text-base px-8 py-4">
            开始我的规划
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link to="/growth" className="neu-btn text-base px-8 py-4">
            成长记录
          </Link>
        </div>

        {/* Floating icons */}
        <div className="mt-16 flex justify-center gap-6 opacity-70">
          {agents.map((a, i) => {
            const Icon = a.icon;
            return (
              <div key={i} className="neu-circle-lg float" style={{ animationDelay: `${i * 0.4}s` }}>
                <Icon className={`w-6 h-6 ${['text-blue-500','text-emerald-500','text-amber-500','text-rose-500','text-slate-700'][i]}`} />
              </div>
            );
          })}
        </div>
      </section>

      {/* Feature Cards */}
      <section>
        <h2 className="text-2xl font-bold text-center mb-10 text-neu-text">核心能力</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div key={idx} className="neu-card-sm flex items-start gap-4 hover:-translate-y-0.5 transition-transform duration-300">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center flex-shrink-0 shadow-md`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-neu-text mb-1">{feature.title}</h3>
                  <p className="text-neu-secondary text-sm leading-relaxed">{feature.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Agent Pipeline */}
      <section>
        <h2 className="text-2xl font-bold text-center mb-3 text-neu-text">5 位 AI 专家协同工作</h2>
        <p className="text-center text-neu-secondary mb-10 max-w-xl mx-auto text-sm">
          模拟真实决策流程，多视角分析后综合输出
        </p>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {agents.map((agent, idx) => {
            const Icon = agent.icon;
            return (
              <div key={idx} className="neu-card-sm text-center relative group hover:-translate-y-1 transition-all duration-300">
                {/* Step number badge */}
                <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-neu-bg
                                shadow-[2px_2px_4px_var(--neu-dark),-2px_-2px_4px_var(--neu-light)]
                                flex items-center justify-center text-[10px] font-bold text-neu-secondary">
                  {idx + 1}
                </div>

                {/* Icon */}
                <div className={`w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-br ${agent.color}
                                flex items-center justify-center
                                shadow-[4px_4px_8px_var(--neu-dark),-3px_-3px_6px_rgba(255,255,255,0.5)]
                                group-hover:shadow-[6px_6px_12px_var(--neu-dark),-4px_-4px_8px_rgba(255,255,255,0.6)]
                                transition-all duration-300`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>

                <h3 className="font-bold text-neu-text text-sm mb-1.5">{agent.name}</h3>
                <p className="text-xs text-neu-muted leading-relaxed">{agent.desc}</p>
              </div>
            );
          })}
        </div>

        {/* Flow dots */}
        <div className="flex items-center justify-center gap-3 mt-8 text-neu-muted text-xs font-medium">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span> 职业
          </span>
          <span>→</span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span> 学习
          </span>
          <span>→</span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span> 财务
          </span>
          <span>→</span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span> 风险
          </span>
          <span>→</span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-slate-600"></span> 综合
          </span>
        </div>
      </section>

      {/* What you get */}
      <section>
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold mb-2 text-neu-text">你将获得什么</h2>
          <p className="text-neu-secondary text-sm">一份完整、可执行的五年成长规划报告</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            {
              title: '个人能力画像',
              icon: Target,
              color: 'from-blue-500 to-cyan-500',
              items: ['多维度能力评分', '核心优势分析', '待改进领域识别', '独特价值定位'],
            },
            {
              title: '五年成长路线图',
              icon: Star,
              color: 'from-emerald-500 to-teal-500',
              items: ['2026-2030 年度主题', '学习/项目/职业目标', '季度里程碑', '收入增长预期'],
            },
            {
              title: '12个月行动计划',
              icon: BookOpen,
              color: 'from-amber-500 to-orange-500',
              items: ['月度核心任务', '可交付成果', '技能提升重点', '资源推荐'],
            },
            {
              title: '风险与执行指南',
              icon: AlertTriangle,
              color: 'from-rose-500 to-pink-500',
              items: ['潜在风险识别', '应急预案', '每日习惯建议', '需避免的陷阱'],
            },
          ].map((section, idx) => {
            const Icon = section.icon;
            return (
              <div key={idx} className="neu-card-sm">
                <div className="flex items-start gap-4 mb-4">
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${section.color}
                                  flex items-center justify-center flex-shrink-0
                                  shadow-[3px_3px_6px_var(--neu-dark),-2px_-2px_4px_rgba(255,255,255,0.5)]`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="pt-1">
                    <h3 className="font-bold text-neu-text text-base">{section.title}</h3>
                  </div>
                </div>
                <ul className="space-y-2 ml-1">
                  {section.items.map((item, i) => (
                    <li key={i} className="flex items-center gap-2.5 text-sm text-neu-secondary">
                      <div className="w-5 h-5 rounded-full bg-neu-bg shadow-neu-xs flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="w-3 h-3 text-emerald-500" />
                      </div>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        <div className="text-center mt-10">
          <Link to="/profile" className="neu-btn-primary inline-flex items-center gap-2 text-base px-10 py-3.5">
            立即开始
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

    </div>
  );
}
