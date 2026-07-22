import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Calendar, Clock, Code, BookOpen, Flame, Target,
  Loader2, CheckCircle, ChevronRight, X, Sparkles, Trash2,
} from 'lucide-react';
import { logApi, userApi } from '../services/api';

export default function GrowthPage() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [stats, setStats] = useState(null);
  const [logs, setLogs] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [aiResult, setAiResult] = useState(null);

  const today = new Date().toISOString().split('T')[0];
  const [formData, setFormData] = useState({
    log_date: today,
    completed_tasks: [],
    learning_hours: 0,
    code_lines: 0,
    reading_count: 0,
    notes: '',
    new_task: '',
  });

  useEffect(() => {
    const initUser = async () => {
      let savedUserId = localStorage.getItem('life_planner_user_id');
      if (!savedUserId) {
        try {
          const res = await userApi.create({ name: '用户' });
          savedUserId = res.data.id;
          localStorage.setItem('life_planner_user_id', savedUserId);
        } catch (e) {
          navigate('/profile');
          return;
        }
      }
      try {
        setUserId(savedUserId);
        await loadData(savedUserId);
      } catch (err) {
        localStorage.removeItem('life_planner_user_id');
        const res = await userApi.create({ name: '用户' });
        const newUid = res.data.id;
        localStorage.setItem('life_planner_user_id', newUid);
        setUserId(newUid);
      }
    };
    initUser();
  }, [navigate]);

  const loadData = async (uid) => {
    setLoading(true);
    try {
      const [logsRes, statsRes] = await Promise.all([
        logApi.list(uid, 30),
        logApi.getStats(uid),
      ]);
      setLogs(logsRes.data || []);
      setStats(statsRes.data);
    } catch (err) {
      console.error('Failed to load data:', err);
    }
    setLoading(false);
  };

  const addTask = () => {
    const task = formData.new_task.trim();
    if (!task) return;
    setFormData(prev => ({
      ...prev,
      completed_tasks: [...prev.completed_tasks, task],
      new_task: '',
    }));
  };

  const removeTask = (idx) => {
    setFormData(prev => ({
      ...prev,
      completed_tasks: prev.completed_tasks.filter((_, i) => i !== idx),
    }));
  };

  const submitLog = async () => {
    if (!userId) return;
    setSubmitting(true);
    try {
      const payload = {
        log_date: formData.log_date,
        completed_tasks: formData.completed_tasks,
        learning_hours: parseFloat(formData.learning_hours) || 0,
        code_lines: parseInt(formData.code_lines) || 0,
        reading_count: parseInt(formData.reading_count) || 0,
        notes: formData.notes,
      };
      const res = await logApi.create(userId, payload);
      setAiResult({
        analysis: res.data.analysis,
        highlights: res.data.highlights || [],
        suggestions: res.data.tomorrow_suggestions || [],
        completion_rate: res.data.completion_rate,
        encouragement: res.data.encouragement,
        trend: res.data.trend,
      });
      await loadData(userId);
      setShowForm(false);
      setFormData({
        log_date: today, completed_tasks: [], learning_hours: 0,
        code_lines: 0, reading_count: 0, notes: '', new_task: '',
      });
    } catch (err) {
      alert('提交失败，请重试');
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-neu-primary" />
      </div>
    );
  }

  const statCards = [
    { label: '坚持天数', value: stats?.total_days || 0, icon: Calendar, color: 'from-blue-500 to-cyan-500' },
    { label: '学习时长', value: `${stats?.total_learning_hours?.toFixed(1) || 0}h`, icon: Clock, color: 'from-emerald-500 to-teal-500' },
    { label: '代码行数', value: stats?.total_code_lines?.toLocaleString() || 0, icon: Code, color: 'from-purple-500 to-pink-500' },
    { label: '连续打卡', value: `${stats?.streak_days || 0}天`, icon: Flame, color: 'from-amber-500 to-orange-500' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 slide-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold gradient-text mb-1">成长记录</h1>
          <p className="text-neu-textLight">记录每日进步，AI 陪你一起成长</p>
        </div>
        <button onClick={() => setShowForm(true)} className="neu-btn-primary flex items-center gap-2 w-full sm:w-auto justify-center">
          <Plus className="w-5 h-5" />
          记录今天
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="neu-card-sm text-center">
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3 mx-auto shadow-lg`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <div className="text-2xl font-bold text-neu-text">{stat.value}</div>
              <div className="text-sm text-neu-textLight">{stat.label}</div>
            </div>
          );
        })}
      </div>

      {/* AI Feedback */}
      {aiResult && (
        <div className="neu-card border-l-4 border-neu-primary">
          <div className="flex items-start gap-4">
            <div className="neu-circle-lg flex-shrink-0">
              <Sparkles className="w-6 h-6 text-neu-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-neu-text">AI 教练反馈</h3>
                <button onClick={() => setAiResult(null)} className="neu-circle w-8 h-8">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center gap-2 mb-3">
                <div className="px-3 py-1 rounded-full bg-neu-bg shadow-neu-inset-sm">
                  <span className="text-sm font-medium">完成度: {aiResult.completion_rate}%</span>
                </div>
                <div className="px-3 py-1 rounded-full bg-neu-bg shadow-neu-inset-sm">
                  <span className="text-sm font-medium">{aiResult.trend}</span>
                </div>
              </div>
              <p className="text-neu-text mb-4 leading-relaxed">{aiResult.analysis}</p>
              {aiResult.suggestions?.length > 0 && (
                <div className="p-4 rounded-xl bg-neu-bg shadow-neu-inset-sm">
                  <p className="text-sm font-semibold text-neu-text mb-2">💡 明日建议：</p>
                  <ul className="space-y-2">
                    {aiResult.suggestions.map((s, i) => (
                      <li key={i} className="text-sm text-neu-textLight flex items-start gap-2">
                        <ChevronRight className="w-4 h-4 text-neu-primary flex-shrink-0 mt-0.5" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {aiResult.encouragement && (
                <p className="mt-4 text-neu-primary font-medium italic">"{aiResult.encouragement}"</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Recent Logs */}
      <div className="neu-card">
        <h2 className="text-lg font-bold mb-6 flex items-center gap-3 text-neu-text">
          <div className="neu-circle"><BookOpen className="w-5 h-5 text-neu-primary" /></div>
          最近记录
        </h2>

        {logs.length === 0 ? (
          <div className="text-center py-12">
            <Target className="w-16 h-16 text-neu-dark/30 mx-auto mb-4" />
            <p className="text-neu-textLight mb-4">还没有成长记录</p>
            <button onClick={() => setShowForm(true)} className="neu-btn inline-flex items-center gap-2">
              <Plus className="w-4 h-4" />
              创建第一条记录
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {logs.map((log) => (
              <div key={log.id} className="p-5 rounded-xl bg-neu-bg shadow-neu-inset-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-neu-textLight" />
                    <span className="font-semibold text-neu-text">{log.log_date}</span>
                  </div>
                  <div className="flex gap-2 text-xs">
                    <span className="px-2 py-1 rounded-full bg-neu-bg shadow-neu-xs">{log.learning_hours}h 学习</span>
                    <span className="px-2 py-1 rounded-full bg-neu-bg shadow-neu-xs">{log.code_lines} 行代码</span>
                  </div>
                </div>
                {log.completed_tasks?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {log.completed_tasks.map((task, i) => (
                      <span key={i} className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-neu-bg shadow-neu-xs text-sm">
                        <CheckCircle className="w-3 h-3 text-emerald-500" />
                        {task}
                      </span>
                    ))}
                  </div>
                )}
                {log.notes && <p className="text-sm text-neu-textLight">{log.notes}</p>}
                {log.ai_analysis && (
                  <div className="mt-3 pt-3 border-t border-neu-dark/10">
                    <p className="text-sm text-neu-text flex items-start gap-2">
                      <Sparkles className="w-4 h-4 text-neu-primary flex-shrink-0 mt-0.5" />
                      {log.ai_analysis}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Log Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm" onClick={() => !submitting && setShowForm(false)}>
          <div className="neu-card w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-neu-text">记录今日成长</h2>
              <button onClick={() => !submitting && setShowForm(false)} className="neu-circle w-9 h-9">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-neu-textLight mb-2 ml-1">日期</label>
                <input type="date" className="neu-input" value={formData.log_date}
                  onChange={e => setFormData(p => ({ ...p, log_date: e.target.value }))} />
              </div>

              <div>
                <label className="block text-sm font-medium text-neu-textLight mb-2 ml-1">今日完成的任务</label>
                <div className="flex gap-2 mb-3">
                  <input type="text" className="neu-input flex-1 text-sm py-2" placeholder="输入完成的任务..."
                    value={formData.new_task}
                    onChange={e => setFormData(p => ({ ...p, new_task: e.target.value }))}
                    onKeyPress={e => e.key === 'Enter' && addTask()} />
                  <button onClick={addTask} className="neu-btn px-4 py-2"><Plus className="w-4 h-4" /></button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.completed_tasks.map((task, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-neu-bg shadow-neu-xs text-sm">
                      <CheckCircle className="w-3 h-3 text-emerald-500" />
                      {task}
                      <button onClick={() => removeTask(idx)} className="ml-1 hover:text-rose-500">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neu-textLight mb-2 ml-1">学习(h)</label>
                  <input type="number" step="0.5" className="neu-input text-center py-2"
                    value={formData.learning_hours}
                    onChange={e => setFormData(p => ({ ...p, learning_hours: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neu-textLight mb-2 ml-1">代码行</label>
                  <input type="number" className="neu-input text-center py-2"
                    value={formData.code_lines}
                    onChange={e => setFormData(p => ({ ...p, code_lines: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neu-textLight mb-2 ml-1">阅读(篇)</label>
                  <input type="number" className="neu-input text-center py-2"
                    value={formData.reading_count}
                    onChange={e => setFormData(p => ({ ...p, reading_count: e.target.value }))} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neu-textLight mb-2 ml-1">备注/感悟</label>
                <textarea className="neu-input min-h-[80px] resize-none" placeholder="今天的收获、思考..."
                  value={formData.notes}
                  onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))} />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowForm(false)} disabled={submitting} className="neu-btn flex-1">取消</button>
              <button onClick={submitLog} disabled={submitting} className="neu-btn-primary flex-1 inline-flex items-center justify-center gap-2">
                {submitting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> 提交中...</>
                ) : (
                  <>提交记录 <Sparkles className="w-4 h-4" /></>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
