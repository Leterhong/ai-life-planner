import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, Briefcase, Code, Heart, Target, Upload, FileText,
  X, ChevronRight, Loader2, Plus, CheckCircle,
} from 'lucide-react';
import { userApi, fileApi } from '../services/api';

const INTEREST_OPTIONS = ['AI', '创业', '技术', '管理', '内容创作', '设计', '投资', '科研'];

const SKILL_TAGS = {
  programming: ['Python', 'JavaScript', 'Java', 'C++', 'Go', 'React', 'Vue', '机器学习', '深度学习', '数据分析'],
  language: ['英语', '日语', '韩语', '法语', '德语', 'CET-4', 'CET-6', '雅思', '托福'],
  professional: ['产品设计', '项目管理', '市场营销', '运营', '数据分析', 'UI设计', '写作', '演讲'],
};

const PROFILE_STORAGE_KEY = 'life_planner_profile_draft';

const loadSavedProfile = () => {
  try {
    const saved = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  return null;
};

const defaultProfile = {
  age: '', education: '', major: '', current_job: '', industry: '',
  work_experience_years: 0, programming_skills: [], language_skills: [],
  professional_skills: [], interests: [], career_goal: '', income_goal: '',
  learning_goal: '', life_goal: '', additional_info: '',
};

export default function ProfilePage() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const savedDraft = loadSavedProfile();
  const [profile, setProfile] = useState(savedDraft || defaultProfile);
  const [files, setFiles] = useState([]);
  const [newSkill, setNewSkill] = useState({ programming: '', language: '', professional: '' });

  useEffect(() => {
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    const savedUserId = localStorage.getItem('life_planner_user_id');
    if (savedUserId) {
      setUserId(savedUserId);
      loadUserData(savedUserId);
    } else {
      createNewUser();
    }
  }, []);

  const createNewUser = async () => {
    try {
      const res = await userApi.create({ name: '用户' });
      localStorage.setItem('life_planner_user_id', res.data.id);
      setUserId(res.data.id);
    } catch (err) {
      console.error('Failed to create user:', err);
    }
  };

  const loadUserData = async (uid) => {
    setLoading(true);
    try {
      const res = await userApi.get(uid);
      if (res.data.profile) {
        const serverProfile = res.data.profile;
        setProfile(prev => {
          const merged = { ...defaultProfile, ...serverProfile };
          if (savedDraft) {
            Object.keys(savedDraft).forEach(key => {
              const val = savedDraft[key];
              if (val !== '' && val !== null && val !== undefined &&
                  (Array.isArray(val) ? val.length > 0 : true)) {
                merged[key] = val;
              }
            });
          }
          return merged;
        });
      }
      const filesRes = await fileApi.list(uid);
      setFiles(filesRes.data || []);
    } catch (err) {
      console.warn('User not found, creating new user');
      localStorage.removeItem('life_planner_user_id');
      createNewUser();
    }
    setLoading(false);
  };

  const handleProfileChange = (field, value) => setProfile(prev => ({ ...prev, [field]: value }));
  const toggleSkill = (category, skill) => {
    const field = `${category}_skills`;
    setProfile(prev => ({
      ...prev,
      [field]: prev[field].includes(skill)
        ? prev[field].filter(s => s !== skill)
        : [...prev[field], skill],
    }));
  };
  const toggleInterest = (interest) => {
    setProfile(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest],
    }));
  };
  const addCustomSkill = (category) => {
    const skill = newSkill[category].trim();
    if (!skill) return;
    const field = `${category}_skills`;
    if (!profile[field].includes(skill)) {
      setProfile(prev => ({ ...prev, [field]: [...prev[field], skill] }));
    }
    setNewSkill(prev => ({ ...prev, [category]: '' }));
  };

  const handleFileUpload = async (e) => {
    const fileList = e.target.files;
    if (!fileList || !userId) return;
    setUploading(true);
    for (const file of fileList) {
      try {
        const res = await fileApi.upload(file, userId);
        setFiles(prev => [...prev, res.data]);
      } catch (err) {
        alert(`文件 ${file.name} 上传失败`);
      }
    }
    setUploading(false);
    e.target.value = '';
  };

  const removeFile = async (fileId) => {
    try {
      await fileApi.delete(fileId);
      setFiles(prev => prev.filter(f => f.id !== fileId));
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const saveProfile = async () => {
    if (!userId) return;
    setSaving(true);
    try {
      const profileData = {
        ...profile,
        age: profile.age ? parseInt(profile.age) : null,
        work_experience_years: parseFloat(profile.work_experience_years) || 0,
      };
      await userApi.updateProfile(userId, profileData);
      navigate('/planning');
    } catch (err) {
      alert('保存失败，请重试');
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-neu-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 slide-up">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2 gradient-text">填写你的信息</h1>
        <p className="text-neu-textLight">信息越完整，AI 专家分析越精准。数据仅用于本次规划</p>
      </div>

      {/* Basic Info */}
      <div className="neu-card">
        <div className="neu-section-header">
          <div className="neu-section-icon"><User className="w-5 h-5 text-neu-primary" /></div>
          <div>
            <h2 className="neu-section-title">基础信息</h2>
            <p className="neu-section-subtitle">年龄、学历、专业等基本情况</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-neu-textLight mb-2 ml-1">年龄</label>
            <input
              type="number" className="neu-input" placeholder="例如：22"
              value={profile.age}
              onChange={(e) => handleProfileChange('age', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neu-textLight mb-2 ml-1">学历</label>
            <select className="neu-select" value={profile.education}
              onChange={(e) => handleProfileChange('education', e.target.value)}>
              <option value="">请选择</option>
              <option value="高中">高中</option>
              <option value="大专">大专</option>
              <option value="本科">本科</option>
              <option value="硕士">硕士</option>
              <option value="博士">博士</option>
              <option value="其他">其他</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-neu-textLight mb-2 ml-1">专业</label>
            <input type="text" className="neu-input" placeholder="例如：计算机科学"
              value={profile.major}
              onChange={(e) => handleProfileChange('major', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-neu-textLight mb-2 ml-1">当前职业</label>
            <input type="text" className="neu-input" placeholder="例如：在校学生"
              value={profile.current_job}
              onChange={(e) => handleProfileChange('current_job', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-neu-textLight mb-2 ml-1">所在行业</label>
            <input type="text" className="neu-input" placeholder="例如：互联网/AI"
              value={profile.industry}
              onChange={(e) => handleProfileChange('industry', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-neu-textLight mb-2 ml-1">工作经验（年）</label>
            <input type="number" step="0.5" className="neu-input" placeholder="0"
              value={profile.work_experience_years}
              onChange={(e) => handleProfileChange('work_experience_years', e.target.value)} />
          </div>
        </div>
      </div>

      {/* Skills */}
      <div className="neu-card">
        <div className="neu-section-header">
          <div className="neu-section-icon"><Code className="w-5 h-5 text-emerald-500" /></div>
          <div>
            <h2 className="neu-section-title">技能信息</h2>
            <p className="neu-section-subtitle">选择或添加你掌握的技能</p>
          </div>
        </div>

        {[
          { key: 'programming', title: '编程能力', icon: '💻', color: 'text-blue-500' },
          { key: 'language', title: '语言能力', icon: '🌐', color: 'text-emerald-500' },
          { key: 'professional', title: '专业技能', icon: '🎯', color: 'text-purple-500' },
        ].map((category) => {
          const field = `${category.key}_skills`;
          return (
            <div key={category.key} className="mb-6 last:mb-0">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-neu-textLight">
                <span>{category.icon}</span>
                {category.title}
              </h3>
              <div className="flex flex-wrap gap-2 mb-3">
                {SKILL_TAGS[category.key].map((skill) => {
                  const isSelected = profile[field].includes(skill);
                  return (
                    <button
                      key={skill}
                      onClick={() => toggleSkill(category.key, skill)}
                      className={`neu-tag cursor-pointer ${isSelected ? 'neu-tag-active' : 'text-neu-textLight'}`}
                    >
                      {isSelected && <CheckCircle className="w-3 h-3 text-neu-primary" />}
                      {skill}
                    </button>
                  );
                })}
                {profile[field].filter(s => !SKILL_TAGS[category.key].includes(s)).map((skill) => (
                  <button key={skill} onClick={() => toggleSkill(category.key, skill)}
                    className="neu-tag neu-tag-active cursor-pointer">
                    <CheckCircle className="w-3 h-3 text-neu-primary" />
                    {skill}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <input type="text" className="neu-input flex-1 text-sm py-2" placeholder="添加自定义技能..."
                  value={newSkill[category.key]}
                  onChange={(e) => setNewSkill(prev => ({ ...prev, [category.key]: e.target.value }))}
                  onKeyPress={(e) => e.key === 'Enter' && addCustomSkill(category.key)} />
                <button onClick={() => addCustomSkill(category.key)} className="neu-btn px-4 py-2">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Interests */}
      <div className="neu-card">
        <div className="neu-section-header">
          <div className="neu-section-icon"><Heart className="w-5 h-5 text-rose-500" /></div>
          <div>
            <h2 className="neu-section-title">兴趣方向</h2>
            <p className="neu-section-subtitle">选择你感兴趣的发展领域</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          {INTEREST_OPTIONS.map((interest) => {
            const isSelected = profile.interests.includes(interest);
            return (
              <button key={interest} onClick={() => toggleInterest(interest)}
                className={`px-5 py-2.5 rounded-full font-medium transition-all duration-200 ${
                  isSelected
                    ? 'bg-neu-bg shadow-neu-inset-sm text-neu-primary'
                    : 'bg-neu-bg shadow-neu-sm text-neu-textLight hover:text-neu-text'
                }`}>
                {interest}
              </button>
            );
          })}
        </div>
      </div>

      {/* Goals */}
      <div className="neu-card">
        <div className="neu-section-header">
          <div className="neu-section-icon"><Target className="w-5 h-5 text-amber-500" /></div>
          <div>
            <h2 className="neu-section-title">未来目标</h2>
            <p className="neu-section-subtitle">告诉 AI 你的职业和人生愿景</p>
          </div>
        </div>
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-neu-textLight mb-2 ml-1">职业目标</label>
            <textarea className="neu-input min-h-[80px] resize-none"
              placeholder="例如：3年内成为AI应用工程师，能够独立主导AI产品开发"
              value={profile.career_goal}
              onChange={(e) => handleProfileChange('career_goal', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-neu-textLight mb-2 ml-1">收入目标</label>
            <input type="text" className="neu-input" placeholder="例如：毕业起薪25-35万/年"
              value={profile.income_goal}
              onChange={(e) => handleProfileChange('income_goal', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-neu-textLight mb-2 ml-1">学习目标</label>
            <textarea className="neu-input min-h-[80px] resize-none"
              placeholder="希望掌握的技能、获得的证书等"
              value={profile.learning_goal}
              onChange={(e) => handleProfileChange('learning_goal', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-neu-textLight mb-2 ml-1">人生目标</label>
            <textarea className="neu-input min-h-[80px] resize-none"
              placeholder="长期愿景、理想的生活状态"
              value={profile.life_goal}
              onChange={(e) => handleProfileChange('life_goal', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-neu-textLight mb-2 ml-1">补充信息（可选）</label>
            <textarea className="neu-input min-h-[80px] resize-none"
              placeholder="其他想告诉AI的信息..."
              value={profile.additional_info}
              onChange={(e) => handleProfileChange('additional_info', e.target.value)} />
          </div>
        </div>
      </div>

      {/* File Upload */}
      <div className="neu-card">
        <div className="neu-section-header">
          <div className="neu-section-icon"><Upload className="w-5 h-5 text-slate-600" /></div>
          <div>
            <h2 className="neu-section-title">上传资料</h2>
            <p className="neu-section-subtitle">PDF、Word、TXT、Markdown（简历、项目等）</p>
          </div>
        </div>

        <label className="block group cursor-pointer">
          <div className="relative rounded-2xl p-8 text-center transition-all duration-300
                          shadow-[inset_3px_3px_6px_var(--neu-dark),inset_-3px_-3px_6px_var(--neu-light)]
                          group-hover:shadow-[inset_4px_4px_8px_var(--neu-dark),inset_-4px_-4px_8px_var(--neu-light)]">
            {uploading ? (
              <>
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-neu-bg
                                shadow-[4px_4px_8px_var(--neu-dark),-4px_-4px_8px_var(--neu-light)]
                                flex items-center justify-center">
                  <Loader2 className="w-7 h-7 text-neu-primary animate-spin" />
                </div>
                <p className="font-medium text-neu-primary mb-1">正在上传...</p>
                <p className="text-xs text-neu-muted">请稍候，AI 正在解析文件</p>
              </>
            ) : (
              <>
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-neu-bg
                                shadow-[4px_4px_8px_var(--neu-dark),-4px_-4px_8px_var(--neu-light)]
                                flex items-center justify-center
                                group-hover:shadow-[inset_3px_3px_6px_var(--neu-dark),inset_-3px_-3px_6px_var(--neu-light)]
                                transition-all duration-300">
                  <Upload className="w-7 h-7 text-neu-secondary group-hover:text-neu-primary transition-colors" />
                </div>
                <p className="font-semibold text-neu-text mb-1">点击或拖拽文件到此处</p>
                <p className="text-xs text-neu-muted">支持多文件上传，单个文件最大 10MB</p>
              </>
            )}
          </div>
          <input type="file" multiple accept=".pdf,.docx,.txt,.md,.doc" className="hidden"
            onChange={handleFileUpload} />
        </label>

        {files.length > 0 && (
          <div className="mt-6 space-y-3">
            <p className="text-xs font-semibold text-neu-secondary uppercase tracking-wider ml-1">
              已上传文件
            </p>
            {files.map((file) => (
              <div key={file.id} className="flex items-center justify-between p-4 rounded-xl
                                              shadow-[inset_2px_2px_5px_var(--neu-dark),inset_-2px_-2px_5px_var(--neu-light)]">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="neu-circle-sm flex-shrink-0 w-10 h-10">
                    <FileText className="w-4 h-4 text-neu-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-neu-text truncate">{file.original_filename}</p>
                    <p className="text-xs text-neu-muted flex items-center gap-2 mt-0.5">
                      {(file.file_size / 1024).toFixed(1)} KB
                      <span>·</span>
                      {file.status === 'processed' ? (
                        <span className="text-emerald-500 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> 解析成功
                        </span>
                      ) : file.status === 'failed' ? (
                        <span className="text-rose-500">解析失败</span>
                      ) : (
                        <span className="text-neu-primary">处理中...</span>
                      )}
                    </p>
                  </div>
                </div>
                <button onClick={() => removeFile(file.id)} className="neu-circle-sm w-8 h-8 ml-2">
                  <X className="w-4 h-4 text-neu-muted hover:text-rose-500" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Submit */}
      <div className="text-center pb-8">
        <button onClick={saveProfile} disabled={saving}
          className="neu-btn-primary text-lg px-12 py-4 inline-flex items-center gap-3">
          {saving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              保存中...
            </>
          ) : (
            <>
              保存并开始规划
              <ChevronRight className="w-5 h-5" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
