import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FileText,
  Star,
  Target,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Sun,
  Download,
  Loader2,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  BookOpen,
  Briefcase,
} from 'lucide-react';
import { planApi } from '../services/api';

function StarRating({ score, label }) {
  const fullStars = Math.floor(score);
  const hasHalf = score % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0);

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-neu-textLight w-20">{label}</span>
      <div className="flex gap-0.5">
        {Array(fullStars).fill(0).map((_, i) => (
          <Star key={`f${i}`} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
        ))}
        {hasHalf && <Star className="w-5 h-5 fill-yellow-400/50 text-yellow-400" />}
        {Array(emptyStars).fill(0).map((_, i) => (
          <Star key={`e${i}`} className="w-5 h-5 text-gray-300" />
        ))}
      </div>
      <span className="text-sm font-semibold text-gray-700">{score}/5</span>
    </div>
  );
}

function YearCard({ yearKey, yearData, yearNumber }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="neu-card hover:shadow-md transition-shadow">
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-bold">
            {yearNumber}
          </div>
          <div>
            <h3 className="font-bold text-neu-text">{yearData?.theme || `${yearNumber}年`}</h3>
            <p className="text-sm text-neu-textLight">{yearData?.focus || ''}</p>
          </div>
        </div>
        {expanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
      </div>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
          {yearData?.learning?.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-blue-600 mb-2 flex items-center gap-1">
                <BookOpen className="w-4 h-4" /> 学习目标
              </h4>
              <ul className="space-y-1">
                {yearData.learning.map((item, i) => (
                  <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                    <span className="text-blue-500">•</span> {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {yearData?.projects?.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-purple-600 mb-2 flex items-center gap-1">
                <Briefcase className="w-4 h-4" /> 项目目标
              </h4>
              <ul className="space-y-1">
                {yearData.projects.map((item, i) => (
                  <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                    <span className="text-purple-500">•</span> {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {yearData?.career?.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-green-600 mb-2 flex items-center gap-1">
                <Target className="w-4 h-4" /> 职业目标
              </h4>
              <ul className="space-y-1">
                {yearData.career.map((item, i) => (
                  <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                    <span className="text-green-500">•</span> {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {yearData?.milestones?.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-orange-600 mb-2 flex items-center gap-1">
                <CheckCircle className="w-4 h-4" /> 里程碑
              </h4>
              <ul className="space-y-1">
                {yearData.milestones.map((item, i) => (
                  <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                    <span className="text-orange-500">✓</span> {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {yearData?.income_target && (
            <div className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
              <span className="text-sm font-semibold text-green-700">收入目标：{yearData.income_target}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ReportPage() {
  const { planId } = useParams();
  const navigate = useNavigate();
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadPlan();
  }, [planId]);

  const loadPlan = async () => {
    try {
      const res = await planApi.get(planId);
      setPlan(res.data);
    } catch (err) {
      console.error('Failed to load plan:', err);
    }
    setLoading(false);
  };

  const exportReport = () => {
    if (!plan?.final_report) return;
    const reportHtml = generateHtmlReport(plan.final_report);
    const blob = new Blob([reportHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '我的未来五年成长规划.html';
    a.click();
    URL.revokeObjectURL(url);
  };

  const generateHtmlReport = (report) => {
    return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>${report.report_title || '我的未来五年成长规划'}</title>
<style>
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:800px;margin:0 auto;padding:40px 20px;color:#333;line-height:1.6}
h1{background:linear-gradient(135deg,#667eea,#764ba2);-webkit-background-clip:text;-webkit-text-fill-color:transparent;text-align:center}
.section{margin:30px 0;padding:20px;background:#f8fafc;border-radius:12px}
h2{color:#4f46e5;border-bottom:2px solid #e0e7ff;padding-bottom:10px}
.rating{margin:10px 0}
.year-card{border:1px solid #e2e8f0;border-radius:8px;padding:15px;margin:10px 0}
.star{color:#fbbf24}
</style></head><body>
<h1>${report.report_title || '我的未来五年成长规划'}</h1>
<p style="text-align:center;color:#666">生成日期：${report.generated_date || new Date().toLocaleDateString()}</p>
<div class="section"><h2>📊 个人能力画像</h2><p>${report.personal_portrait?.summary || ''}</p></div>
<div class="section"><h2>🎯 推荐方向</h2><p><strong>主要方向：</strong>${report.recommended_direction?.primary_path || ''}</p><p><strong>目标职位：</strong>${report.recommended_direction?.target_position || ''}</p><p><strong>五年愿景：</strong>${report.recommended_direction?.vision_5year || ''}</p></div>
<div class="section"><h2>🗺️ 五年路线图</h2>${Object.entries(report.five_year_roadmap || {}).map(([k,v]) => `<div class="year-card"><h3>${k}: ${v?.theme || ''}</h3><p>${v?.focus || ''}</p></div>`).join('')}</div>
<div class="section"><h2>⚠️ 风险提醒</h2><ul>${(report.risk_acknowledgment?.major_risks || []).map(r => `<li>${r}</li>`).join('')}</ul></div>
<div class="section"><h2>💡 每日执行建议</h2>${report.daily_execution_guide?.habits_to_build?.map(h => `<p>✓ ${h}</p>`).join('') || ''}</div>
<div style="text-align:center;margin-top:40px;padding:20px;background:linear-gradient(135deg,#667eea,#764ba2);color:white;border-radius:12px">
<p style="font-size:18px;font-style:italic">${report.inspiring_message || ''}</p></div>
</body></html>`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-neu-primary" />
      </div>
    );
  }

  if (!plan || !plan.final_report) {
    return (
      <div className="text-center py-20">
        <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-neu-text mb-2">报告未找到</h2>
        <p className="text-neu-textLight mb-4">规划可能仍在进行中或出现错误</p>
        <button onClick={() => navigate('/planning')} className="btn-primary">
          返回规划页
        </button>
      </div>
    );
  }

  const report = plan.final_report;
  const portrait = report.personal_portrait || {};
  const roadmap = report.five_year_roadmap || {};
  const monthlyPlan = report.twelve_month_action_plan || {};
  const risks = report.risk_acknowledgment || {};
  const dailyGuide = report.daily_execution_guide || {};

  const tabs = [
    { key: 'overview', label: '概览', icon: FileText },
    { key: 'roadmap', label: '五年路线', icon: Calendar },
    { key: 'monthly', label: '12月计划', icon: Target },
    { key: 'risk', label: '风险提醒', icon: AlertTriangle },
    { key: 'daily', label: '每日执行', icon: Sun },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="glass-card p-8 text-center">
        <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent mb-2">
          {report.report_title || '我的未来五年成长规划'}
        </h1>
        <p className="text-neu-textLight">生成日期：{report.generated_date || new Date().toLocaleDateString('zh-CN')}</p>
        <button onClick={exportReport} className="btn-secondary mt-4 inline-flex items-center gap-2">
          <Download className="w-4 h-4" />
          导出报告
        </button>
      </div>

      {/* Inspiring Message */}
      {report.inspiring_message && (
        <div className="bg-gradient-to-r from-primary-500 to-accent-500 rounded-2xl p-6 text-white text-center">
          <p className="text-lg md:text-xl font-medium italic">"{report.inspiring_message}"</p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-all ${
                activeTab === tab.key
                  ? 'bg-primary-600 text-white shadow-md'
                  : 'bg-white text-neu-textLight hover:bg-neu-bg'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Personal Portrait */}
          <div className="card">
            <h2 className="section-title">
              <TrendingUp className="w-5 h-5 text-neu-primary" />
              个人能力画像
            </h2>
            <p className="text-gray-700 mb-6 leading-relaxed">{portrait.summary}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {portrait.ratings && Object.entries(portrait.ratings).map(([key, rating]) => (
                <StarRating
                  key={key}
                  score={rating?.score || 0}
                  label={rating?.label || key}
                />
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-semibold text-green-700 mb-2 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" /> 核心优势
                </h3>
                <ul className="space-y-2">
                  {(portrait.key_strengths || []).map((s, i) => (
                    <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                      <span className="text-green-500 mt-0.5">✓</span> {s}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-orange-700 mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" /> 需要改进
                </h3>
                <ul className="space-y-2">
                  {(portrait.key_weaknesses || []).map((s, i) => (
                    <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                      <span className="text-orange-500 mt-0.5">!</span> {s}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {portrait.unique_value && (
              <div className="mt-6 p-4 bg-gradient-to-r from-primary-50 to-accent-50 rounded-xl">
                <p className="text-sm font-semibold text-primary-700 mb-1">✨ 你的独特价值</p>
                <p className="text-gray-700">{portrait.unique_value}</p>
              </div>
            )}
          </div>

          {/* Recommended Direction */}
          {report.recommended_direction && (
            <div className="card">
              <h2 className="section-title">
                <Target className="w-5 h-5 text-neu-primary" />
                推荐发展方向
              </h2>
              <div className="space-y-4">
                <div className="p-4 bg-gradient-to-r from-primary-500 to-accent-500 rounded-xl text-white">
                  <p className="text-sm opacity-80">主要方向</p>
                  <p className="text-xl font-bold">{report.recommended_direction.primary_path}</p>
                  <p className="text-sm opacity-80 mt-2">目标职位：{report.recommended_direction.target_position}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-2">五年愿景</p>
                  <p className="text-neu-textLight">{report.recommended_direction.vision_5year}</p>
                </div>
                {report.recommended_direction.why_this_path?.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-2">为什么选择这个方向</p>
                    <ul className="space-y-1">
                      {report.recommended_direction.why_this_path.map((r, i) => (
                        <li key={i} className="text-sm text-neu-textLight flex items-start gap-2">
                          <span className="text-primary-500">•</span> {r}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'roadmap' && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-neu-text mb-4">🗺️ 未来五年成长路线图</h2>
          {Object.entries(roadmap).map(([key, data], idx) => {
            const yearNum = 2026 + idx;
            return <YearCard key={key} yearKey={key} yearData={data} yearNumber={yearNum} />;
          })}
        </div>
      )}

      {activeTab === 'monthly' && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-neu-text mb-4">📅 未来12个月详细行动计划</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(monthlyPlan).map(([month, data], idx) => (
              <div key={month} className="card">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-sm">
                    {idx + 1}
                  </div>
                  <h3 className="font-bold text-neu-text">{data?.theme || `第${idx + 1}个月`}</h3>
                </div>
                {data?.key_deliverables?.length > 0 && (
                  <div className="text-sm text-neu-textLight">
                    <p className="font-medium text-gray-700 mb-1">核心交付物：</p>
                    <ul className="space-y-1">
                      {data.key_deliverables.slice(0, 3).map((d, i) => (
                        <li key={i} className="flex items-start gap-1">
                          <span className="text-primary-500">•</span> {d}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'risk' && (
        <div className="space-y-6">
          <div className="card">
            <h2 className="section-title">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              需要警惕的主要风险
            </h2>
            <ul className="space-y-3">
              {(risks.major_risks || []).map((risk, i) => (
                <li key={i} className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">{risk}</span>
                </li>
              ))}
            </ul>
          </div>

          {risks.contingency_plans?.length > 0 && (
            <div className="card">
              <h2 className="section-title">应急预案</h2>
              <div className="space-y-3">
                {risks.contingency_plans.map((cp, i) => (
                  <div key={i} className="p-3 bg-yellow-50 rounded-lg">
                    <p className="font-medium text-neu-text mb-1">风险：{cp.risk}</p>
                    <p className="text-sm text-neu-textLight">预案：{cp.plan}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {risks.reality_check && (
            <div className="neu-card bg-neu-bg">
              <h2 className="section-title">现实认知</h2>
              <p className="text-gray-700">{risks.reality_check}</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'daily' && (
        <div className="space-y-6">
          <div className="card">
            <h2 className="section-title">
              <Sun className="w-5 h-5 text-yellow-500" />
              每日执行指南
            </h2>

            {dailyGuide.morning_routine?.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold text-blue-700 mb-2">🌅 早晨习惯 (30分钟)</h3>
                <ul className="space-y-2">
                  {dailyGuide.morning_routine.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-gray-700">
                      <span className="text-blue-500">{i + 1}.</span> {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {dailyGuide.daily_priorities?.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold text-purple-700 mb-2">🎯 每日核心任务 (3-5小时)</h3>
                <ul className="space-y-2">
                  {dailyGuide.daily_priorities.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-gray-700">
                      <span className="text-purple-500">{i + 1}.</span> {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {dailyGuide.evening_review?.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold text-orange-700 mb-2">🌙 晚间复盘 (15分钟)</h3>
                <ul className="space-y-2">
                  {dailyGuide.evening_review.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-gray-700">
                      <span className="text-orange-500">{i + 1}.</span> {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {dailyGuide.habits_to_build?.length > 0 && (
              <div className="card">
                <h3 className="font-semibold text-green-700 mb-3">✅ 需要养成的习惯</h3>
                <ul className="space-y-2">
                  {dailyGuide.habits_to_build.map((h, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" /> {h}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {dailyGuide.habits_to_avoid?.length > 0 && (
              <div className="card">
                <h3 className="font-semibold text-red-700 mb-3">❌ 需要避免的习惯</h3>
                <ul className="space-y-2">
                  {dailyGuide.habits_to_avoid.map((h, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                      <X className="w-4 h-4 text-red-500 mt-0.5" /> {h}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Agent Results Summary */}
      {plan.agent_results?.length > 0 && (
        <div className="card">
          <h2 className="section-title">🤖 各专家分析结果</h2>
          <div className="space-y-3">
            {plan.agent_results.map((result) => (
              <div key={result.id} className="p-4 bg-neu-bg rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-neu-text">{result.agent_name}</h3>
                  <span className={`badge ${
                    result.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {result.status === 'completed' ? '已完成' : '失败'}
                  </span>
                </div>
                {result.content?.key_recommendations && (
                  <ul className="text-sm text-neu-textLight space-y-1">
                    {result.content.key_recommendations.slice(0, 3).map((r, i) => (
                      <li key={i}>• {r}</li>
                    ))}
                  </ul>
                )}
                {result.content?.learning_tips && (
                  <ul className="text-sm text-neu-textLight space-y-1">
                    {result.content.learning_tips.slice(0, 3).map((r, i) => (
                      <li key={i}>• {r}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function X({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}
