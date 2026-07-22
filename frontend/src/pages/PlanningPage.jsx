import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Brain, Briefcase, BookOpen, DollarSign, AlertTriangle, Crown,
  Loader2, CheckCircle2, Play, ChevronRight, RefreshCw, Clock,
} from 'lucide-react';
import { planApi, userApi } from '../services/api';

const AGENT_STEPS = [
  {
    key: 'career_analysis',
    agentType: 'career',
    name: '职业规划专家',
    icon: Briefcase,
    gradient: 'from-blue-500 to-cyan-500',
    lightColor: 'bg-blue-500/10',
    textColor: 'text-blue-500',
    desc: '分析职业定位、优势短板、行业匹配度',
  },
  {
    key: 'learning_analysis',
    agentType: 'learning',
    name: '学习成长导师',
    icon: BookOpen,
    gradient: 'from-emerald-500 to-teal-500',
    lightColor: 'bg-emerald-500/10',
    textColor: 'text-emerald-500',
    desc: '制定技能路线、学习计划、资源推荐',
  },
  {
    key: 'finance_analysis',
    agentType: 'finance',
    name: '财务规划专家',
    icon: DollarSign,
    gradient: 'from-amber-500 to-orange-500',
    lightColor: 'bg-amber-500/10',
    textColor: 'text-amber-500',
    desc: '收入增长路径、副业机会、财务建议',
  },
  {
    key: 'risk_analysis',
    agentType: 'risk',
    name: '风险挑战专家',
    icon: AlertTriangle,
    gradient: 'from-rose-500 to-pink-500',
    lightColor: 'bg-rose-500/10',
    textColor: 'text-rose-500',
    desc: '质疑假设、识别风险、提供预案',
  },
  {
    key: 'master_synthesis',
    agentType: 'master',
    name: '人生总规划师',
    icon: Crown,
    gradient: 'from-slate-600 to-slate-800',
    lightColor: 'bg-slate-600/10',
    textColor: 'text-slate-700',
    desc: '综合所有意见，生成最终五年规划',
  },
];

export default function PlanningPage() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [planId, setPlanId] = useState(null);
  const [progress, setProgress] = useState({
    status: 'idle', current_step: 'idle', progress_percent: 0, agent_results: [],
  });
  const [errorMsg, setErrorMsg] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    const initUser = async () => {
      let savedUserId = localStorage.getItem('life_planner_user_id');
      if (!savedUserId) {
        try {
          const res = await userApi.create({ name: '用户' });
          savedUserId = res.data.id;
          localStorage.setItem('life_planner_user_id', savedUserId);
          navigate('/profile');
          return;
        } catch (e) { navigate('/profile'); return; }
      }
      try {
        const res = await userApi.get(savedUserId);
        setUserId(savedUserId);
        setUserProfile(res.data);
      } catch (err) {
        localStorage.removeItem('life_planner_user_id');
        const res = await userApi.create({ name: '用户' });
        const newUid = res.data.id;
        localStorage.setItem('life_planner_user_id', newUid);
        setUserId(newUid);
        setUserProfile(res.data);
      }
    };
    initUser();
  }, [navigate]);

  const startPlanning = async () => {
    try {
      setErrorMsg(null);
      setElapsedTime(0);
      setProgress({ status: 'processing', current_step: 'starting', progress_percent: 0, agent_results: [] });
      const res = await planApi.create(userId);
      const plan = res.data;
      setPlanId(plan.id);

      if (plan.status === 'completed') {
        setProgress({
          status: 'completed', current_step: 'completed', progress_percent: 100,
          agent_results: plan.agent_results || [],
        });
        setTimeout(() => navigate(`/report/${plan.id}`), 1500);
      } else {
        startPolling(plan.id);
      }
    } catch (err) {
      console.error('Failed to create plan:', err);
      setErrorMsg('启动规划失败，请点击重试');
      setProgress({ ...progress, status: 'idle' });
    }
  };

  const startPolling = (pid) => {
    // Start timer
    const startTime = Date.now();
    const timerInterval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    const interval = setInterval(async () => {
      try {
        const res = await planApi.getProgress(pid);
        setProgress(res.data);
        if (res.data.status === 'completed') {
          clearInterval(interval);
          clearInterval(timerInterval);
          setTimeout(() => navigate(`/report/${pid}`), 1500);
        } else if (res.data.status === 'failed') {
          clearInterval(interval);
          clearInterval(timerInterval);
          setErrorMsg('规划生成失败，请重试');
        }
      } catch (err) {
        console.error('Progress error:', err);
      }
    }, 2000);
  };

  const getStepData = (step) => {
    const result = progress.agent_results?.find(r => r.agent_type === step.agentType);
    return result || null;
  };

  const getStepStatus = (step) => {
    const result = getStepData(step);
    if (result) {
      return result.status === 'completed' ? 'completed' : 'failed';
    }
    if (progress.current_step === step.key) return 'active';
    // For steps after current, check if any prior step is the active one
    const stepOrder = AGENT_STEPS.map(s => s.key);
    const currentIdx = stepOrder.indexOf(progress.current_step);
    const stepIdx = stepOrder.indexOf(step.key);
    if (currentIdx !== -1 && stepIdx < currentIdx) return 'completed';
    return 'pending';
  };

  const completedCount = progress.agent_results?.filter(r => r.status === 'completed').length || 0;
  const hasProfile = userProfile?.profile && (
    userProfile.profile.age || userProfile.profile.current_job ||
    userProfile.profile.career_goal || userProfile.profile.programming_skills?.length > 0
  );

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 slide-up">
      {/* Header */}
      <div className="text-center">
        <div className="neu-circle-xl mx-auto mb-6 float">
          <Brain className="w-8 h-8 text-neu-primary" />
        </div>
        <h1 className="text-3xl font-bold mb-3 gradient-text">AI 多专家协同规划</h1>
        <p className="text-neu-secondary max-w-md mx-auto">
          5 位 AI 专家将依次分析，经过独立分析、风险质疑、综合决策，生成你的专属规划
        </p>
      </div>

      {/* Profile Summary */}
      {userProfile?.profile && hasProfile && (
        <div className="neu-card-sm">
          <p className="text-xs font-semibold text-neu-muted uppercase tracking-wider mb-3">你的信息</p>
          <div className="flex flex-wrap gap-2">
            {userProfile.profile.age && (
              <span className="neu-tag text-xs">
                <span className="text-neu-muted">年龄</span>
                <span className="font-semibold text-neu-text">{userProfile.profile.age}岁</span>
              </span>
            )}
            {userProfile.profile.education && (
              <span className="neu-tag text-xs">
                <span className="text-neu-muted">学历</span>
                <span className="font-semibold text-neu-text">{userProfile.profile.education}</span>
              </span>
            )}
            {userProfile.profile.current_job && (
              <span className="neu-tag text-xs">
                <span className="text-neu-muted">职业</span>
                <span className="font-semibold text-neu-text">{userProfile.profile.current_job}</span>
              </span>
            )}
            {userProfile.profile.programming_skills?.slice(0, 3).map(s => (
              <span key={s} className="neu-tag text-xs">
                <span className="font-semibold text-neu-text">{s}</span>
              </span>
            ))}
            {userProfile.profile.programming_skills?.length > 3 && (
              <span className="neu-tag text-xs text-neu-muted">+{userProfile.profile.programming_skills.length - 3}</span>
            )}
          </div>
          {userProfile.profile.career_goal && (
            <div className="mt-3 p-3 rounded-xl shadow-[inset_2px_2px_5px_var(--neu-dark),inset_-2px_-2px_5px_var(--neu-light)]">
              <p className="text-xs text-neu-muted mb-1">职业目标</p>
              <p className="text-sm text-neu-text">{userProfile.profile.career_goal}</p>
            </div>
          )}
        </div>
      )}

      {/* Progress Timer */}
      {progress.status === 'processing' && (
        <div className="flex items-center justify-center gap-4 text-sm">
          <div className="neu-tag">
            <Clock className="w-3.5 h-3.5 text-neu-primary" />
            <span className="font-mono font-semibold">{formatTime(elapsedTime)}</span>
          </div>
          <div className="text-neu-secondary">
            已完成 <span className="font-bold text-neu-primary">{completedCount}/5</span> 位专家
          </div>
        </div>
      )}

      {/* Agent Steps */}
      <div className="neu-card p-5">
        <div className="space-y-3">
          {AGENT_STEPS.map((step, idx) => {
            const Icon = step.icon;
            const status = getStepStatus(step);
            const result = getStepData(step);

            return (
              <div key={step.key} className="relative">
                {/* Connector line */}
                {idx < AGENT_STEPS.length - 1 && (
                  <div className={`absolute left-6 top-14 w-0.5 transition-all duration-500 ${
                    status === 'completed'
                      ? 'h-[calc(100%-20px)] bg-gradient-to-b from-emerald-400/40 to-transparent'
                      : 'h-[calc(100%-20px)] bg-neu-dark/20'
                  }`} />
                )}

                <div className={`flex items-start gap-4 p-3 rounded-xl transition-all duration-500 ${
                  status === 'active' ? 'bg-neu-bg shadow-[inset_2px_2px_5px_var(--neu-dark),inset_-2px_-2px_5px_var(--neu-light)]' : ''
                }`}>
                  {/* Icon Circle */}
                  <div className={`relative w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 shadow-[3px_3px_6px_var(--neu-dark),-3px_-3px_6px_var(--neu-light)] ${
                    status === 'completed'
                      ? `bg-gradient-to-br ${step.gradient}`
                      : status === 'active'
                      ? 'bg-neu-bg shadow-[inset_3px_3px_6px_var(--neu-dark),inset_-3px_-3px_6px_var(--neu-light)]'
                      : status === 'failed'
                      ? 'bg-gradient-to-br from-rose-500 to-red-500'
                      : `bg-gradient-to-br ${step.gradient}`
                  }`}>
                    {status === 'completed' ? (
                      <CheckCircle2 className="w-6 h-6 text-white" />
                    ) : status === 'active' ? (
                      <Loader2 className={`w-5 h-5 animate-spin ${step.textColor}`} />
                    ) : status === 'failed' ? (
                      <AlertTriangle className="w-5 h-5 text-white" />
                    ) : (
                      <Icon className="w-5 h-5 text-white" />
                    )}

                    {/* Step number badge for pending */}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 pt-1">
                    <div className="flex items-center justify-between mb-0.5">
                      <h4 className="font-semibold text-sm text-neu-text">{step.name}</h4>
                      {status === 'completed' && result?.status === 'completed' && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600">
                          完成
                        </span>
                      )}
                      {status === 'failed' && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600">
                          失败
                        </span>
                      )}
                      {status === 'active' && (
                        <div className="loading-dots flex gap-0.5">
                          <span /> <span /> <span />
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-neu-secondary">{step.desc}</p>

                    {/* Preview for completed */}
                    {status === 'completed' && result?.content && (
                      <div className="mt-2 text-xs text-neu-secondary line-clamp-1 italic opacity-70">
                        {result.content.current_position?.title ||
                         result.content.skill_gap_analysis?.current_level ||
                         result.content.executive_summary ||
                         result.content.key_recommendations?.[0] ||
                         '分析完成'}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Overall Progress Bar */}
        {progress.status === 'processing' && (
          <div className="mt-6 pt-5 border-t border-neu-dark/10">
            <div className="flex justify-between text-xs mb-2">
              <span className="text-neu-secondary font-medium">总进度</span>
              <span className="font-bold text-neu-primary">{progress.progress_percent}%</span>
            </div>
            <div className="neu-progress-bg">
              <div className="neu-progress-fill" style={{ width: `${progress.progress_percent}%` }} />
            </div>
          </div>
        )}
      </div>

      {/* Success state */}
      {progress.status === 'completed' && (
        <div className="neu-card text-center py-10">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600
                          shadow-[6px_6px_12px_var(--neu-dark),-6px_-6px_12px_var(--neu-light)]
                          flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-xl font-bold text-neu-text mb-2">规划生成完成！</h2>
          <p className="text-neu-secondary text-sm">正在跳转到报告页...</p>
        </div>
      )}

      {/* Error state */}
      {errorMsg && (
        <div className="neu-card text-center py-8 border-rose-200/50">
          <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
          <p className="text-rose-600 font-medium mb-4">{errorMsg}</p>
          <button onClick={startPlanning} className="neu-btn-primary inline-flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            重新开始规划
          </button>
        </div>
      )}

      {/* Start Button */}
      {progress.status === 'idle' && (
        <div className="text-center space-y-4">
          {!hasProfile && (
            <div className="neu-card-sm py-3 px-5 inline-block bg-amber-50/30">
              <p className="text-sm text-amber-700">
                ⚠️ 建议先完善个人信息，分析会更精准
              </p>
            </div>
          )}
          <div>
            <button onClick={startPlanning} className="neu-btn-primary text-lg px-10 py-4">
              <Play className="w-6 h-6 fill-current" />
              开始五年规划
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
