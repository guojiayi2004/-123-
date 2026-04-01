import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Calendar, 
  Search, 
  ShieldCheck, 
  LogOut, 
  Plus, 
  Trash2, 
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  User,
  Stethoscope,
  TrendingUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { Toaster, toast } from 'sonner';

interface Doctor {
  id: number;
  name: string;
  dept: string;
  max_num: number;
  current_num: number;
}

interface Appointment {
  id: number;
  patientName: string;
  doctorId: number;
  doctorName: string;
  dept: string;
  sequenceNum: number;
  appointmentTime: string;
  status: number;
}

export default function App() {
  const [view, setView] = useState<'patient' | 'admin'>('patient');
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [searchName, setSearchName] = useState('');
  const [selectedDept, setSelectedDept] = useState('全部');

  // Form states
  const [bookingForm, setBookingForm] = useState({ patientName: '', doctorId: '' });
  const [newDoctorForm, setNewDoctorForm] = useState({ id: '', name: '', dept: '', max_num: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [docsRes, appsRes] = await Promise.all([
        fetch('/api/doctors'),
        fetch('/api/appointments')
      ]);
      const docs = await docsRes.json();
      const apps = await appsRes.json();
      setDoctors(docs);
      setAppointments(apps);
    } catch (error) {
      console.error("Failed to fetch data", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingForm.patientName || !bookingForm.doctorId) {
      toast.error("请填写完整信息");
      return;
    }
    
    const loadingToast = toast.loading("正在提交预约...");
    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientName: bookingForm.patientName,
          doctorId: parseInt(bookingForm.doctorId)
        })
      });
      
      if (res.ok) {
        toast.success("预约成功！", { id: loadingToast });
        setBookingForm({ patientName: '', doctorId: '' });
        fetchData();
      } else {
        const err = await res.json();
        toast.error(err.error || "预约失败", { id: loadingToast });
      }
    } catch (error) {
      toast.error("预约失败，请检查网络", { id: loadingToast });
    }
  };

  const handleCancelAppointment = async (id: number) => {
    toast("确定要取消这个预约吗？", {
      action: {
        label: "确认取消",
        onClick: async () => {
          try {
            const res = await fetch(`/api/appointments/cancel/${id}`, { method: 'POST' });
            if (res.ok) {
              toast.success("预约已取消");
              fetchData();
            }
          } catch (error) {
            toast.error("操作失败");
          }
        },
      },
    });
  };

  const handleAddDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    const loadingToast = toast.loading("正在添加医生...");
    try {
      const res = await fetch('/api/doctors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: parseInt(newDoctorForm.id),
          name: newDoctorForm.name,
          dept: newDoctorForm.dept,
          max_num: parseInt(newDoctorForm.max_num)
        })
      });
      if (res.ok) {
        toast.success("医生添加成功", { id: loadingToast });
        setNewDoctorForm({ id: '', name: '', dept: '', max_num: '' });
        fetchData();
      } else {
        toast.error("添加失败", { id: loadingToast });
      }
    } catch (error) {
      toast.error("添加失败", { id: loadingToast });
    }
  };

  const handleDeleteDoctor = async (id: number) => {
    toast("确定要删除这位医生吗？", {
      action: {
        label: "确认删除",
        onClick: async () => {
          try {
            const res = await fetch(`/api/doctors/${id}`, { method: 'DELETE' });
            if (res.ok) {
              toast.success("医生已删除");
              fetchData();
            }
          } catch (error) {
            toast.error("删除失败");
          }
        },
      },
    });
  };

  const handleResetQuota = async () => {
    toast("确定要重置所有医生的号源吗？", {
      action: {
        label: "确认重置",
        onClick: async () => {
          try {
            const res = await fetch('/api/doctors/reset', { method: 'POST' });
            if (res.ok) {
              toast.success("号源已重置");
              fetchData();
            }
          } catch (error) {
            toast.error("重置失败");
          }
        },
      },
    });
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPassword === '123') {
      setIsAdminLoggedIn(true);
      setAdminPassword('');
      toast.success("登录成功");
    } else {
      toast.error("密码错误！");
    }
  };

  const scrollToBooking = (docId: number) => {
    setBookingForm({ ...bookingForm, doctorId: docId.toString() });
    const element = document.getElementById('booking-section');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      // Focus the name input
      const nameInput = document.getElementById('patient-name-input');
      if (nameInput) nameInput.focus();
    }
    toast.info(`已选择 ${doctors.find(d => d.id === docId)?.name} 医生，请填写您的姓名`);
  };

  const filteredDoctors = doctors.filter(d => 
    selectedDept === '全部' || d.dept === selectedDept
  );

  const departments = ['全部', ...new Set(doctors.map(d => d.dept))];

  const myAppointments = appointments.filter(a => 
    searchName && a.patientName.toLowerCase().includes(searchName.toLowerCase())
  );

  const sortedDoctorsByPopularity = [...doctors].sort((a, b) => b.current_num - a.current_num);

  return (
    <div className="min-h-screen bg-[#F5F5F0] text-[#141414] font-sans selection:bg-[#5A5A40] selection:text-white">
      {/* Header */}
      <header className="bg-white border-b border-[#141414]/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#5A5A40] rounded-full flex items-center justify-center text-white">
              <Stethoscope size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">SZPU Hospital</h1>
              <p className="text-[10px] uppercase tracking-widest opacity-50 font-semibold">Appointment System v2.0</p>
            </div>
          </div>

          <nav className="flex items-center gap-1 bg-[#F5F5F0] p-1 rounded-full border border-[#141414]/5">
            <button 
              onClick={() => setView('patient')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${view === 'patient' ? 'bg-white shadow-sm text-[#5A5A40]' : 'text-gray-500 hover:text-gray-800'}`}
            >
              患者服务
            </button>
            <button 
              onClick={() => setView('admin')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${view === 'admin' ? 'bg-white shadow-sm text-[#5A5A40]' : 'text-gray-500 hover:text-gray-800'}`}
            >
              后台管理
            </button>
          </nav>

          <div className="hidden md:flex items-center gap-4 text-xs font-medium opacity-60">
            <Clock size={14} />
            {new Date().toLocaleDateString()}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <AnimatePresence mode="wait">
          {view === 'patient' ? (
            <motion.div 
              key="patient"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-12"
            >
              {/* Hero Section */}
              <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-3xl font-serif italic">医生排班看板</h2>
                    <div className="flex gap-2">
                      {departments.map(dept => (
                        <button
                          key={dept}
                          onClick={() => setSelectedDept(dept)}
                          className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-all ${selectedDept === dept ? 'bg-[#5A5A40] text-white border-[#5A5A40]' : 'bg-white border-gray-200 hover:border-gray-400'}`}
                        >
                          {dept}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredDoctors.map(doctor => (
                      <div key={doctor.id} className="bg-white p-6 rounded-3xl border border-[#141414]/5 shadow-sm hover:shadow-md transition-shadow group">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-[#5A5A40] opacity-70">{doctor.dept}</span>
                            <h3 className="text-xl font-bold mt-1">{doctor.name}</h3>
                            <p className="text-xs text-gray-400 mt-0.5">ID: {doctor.id}</p>
                          </div>
                          <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${doctor.current_num >= doctor.max_num ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                            {doctor.current_num >= doctor.max_num ? '满号' : '有号'}
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs font-medium">
                            <span className="opacity-50">挂号饱和度</span>
                            <span>{doctor.current_num} / {doctor.max_num}</span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${(doctor.current_num / doctor.max_num) * 100}%` }}
                              className={`h-full rounded-full ${doctor.current_num / doctor.max_num > 0.8 ? 'bg-red-500' : 'bg-[#5A5A40]'}`}
                            />
                          </div>
                        </div>

                        <button 
                          disabled={doctor.current_num >= doctor.max_num}
                          onClick={() => scrollToBooking(doctor.id)}
                          className="w-full mt-6 py-3 rounded-2xl bg-[#F5F5F0] text-[#5A5A40] text-sm font-bold hover:bg-[#5A5A40] hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          立即预约
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-8">
                  {/* Booking Form */}
                  <div id="booking-section" className="bg-white p-8 rounded-[2rem] border border-[#141414]/5 shadow-xl">
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                      <Calendar className="text-[#5A5A40]" size={20} />
                      办理预约挂号
                    </h3>
                    <form onSubmit={handleBooking} className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">患者姓名</label>
                        <input 
                          id="patient-name-input"
                          type="text" 
                          required
                          value={bookingForm.patientName}
                          onChange={e => setBookingForm({ ...bookingForm, patientName: e.target.value })}
                          placeholder="请输入姓名"
                          className="w-full px-4 py-3 rounded-xl bg-[#F5F5F0] border-none focus:ring-2 focus:ring-[#5A5A40] transition-all text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">医生 ID</label>
                        <input 
                          type="number" 
                          required
                          value={bookingForm.doctorId}
                          onChange={e => setBookingForm({ ...bookingForm, doctorId: e.target.value })}
                          placeholder="请输入医生ID"
                          className="w-full px-4 py-3 rounded-xl bg-[#F5F5F0] border-none focus:ring-2 focus:ring-[#5A5A40] transition-all text-sm"
                        />
                      </div>
                      <button 
                        type="submit"
                        className="w-full py-4 rounded-xl bg-[#5A5A40] text-white font-bold text-sm shadow-lg shadow-[#5A5A40]/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                      >
                        确认挂号
                      </button>
                    </form>
                  </div>

                  {/* Hot Doctors */}
                  <div className="bg-[#141414] text-white p-8 rounded-[2rem] shadow-xl overflow-hidden relative">
                    <TrendingUp className="absolute -right-4 -top-4 text-white/10" size={120} />
                    <h3 className="text-xl font-bold mb-6 relative z-10">医生热度榜</h3>
                    <div className="space-y-4 relative z-10">
                      {sortedDoctorsByPopularity.slice(0, 3).map((doc, idx) => (
                        <div key={doc.id} className="flex items-center gap-4 p-3 rounded-2xl bg-white/5 border border-white/10">
                          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold">
                            0{idx + 1}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-bold">{doc.name}</p>
                            <p className="text-[10px] opacity-50">{doc.dept}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-bold">{doc.current_num} 人</p>
                            <p className="text-[8px] opacity-30 uppercase">已约</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              {/* My Appointments */}
              <section className="bg-white rounded-[2.5rem] border border-[#141414]/5 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-serif italic">我的预约查询</h2>
                    <p className="text-xs text-gray-400 mt-1">输入您的姓名查看所有挂号记录</p>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                      type="text" 
                      placeholder="搜索姓名..."
                      value={searchName}
                      onChange={e => setSearchName(e.target.value)}
                      className="pl-12 pr-6 py-3 rounded-full bg-[#F5F5F0] border-none focus:ring-2 focus:ring-[#5A5A40] transition-all text-sm w-full md:w-64"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-[#F5F5F0]/50 text-[10px] uppercase tracking-widest font-bold text-gray-400">
                        <th className="px-8 py-4">单号</th>
                        <th className="px-8 py-4">医生</th>
                        <th className="px-8 py-4">科室</th>
                        <th className="px-8 py-4">序号</th>
                        <th className="px-8 py-4">预约时间</th>
                        <th className="px-8 py-4">状态</th>
                        <th className="px-8 py-4 text-right">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {myAppointments.length > 0 ? myAppointments.map(app => (
                        <tr key={app.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-8 py-5 text-sm font-mono text-gray-400">#{app.id}</td>
                          <td className="px-8 py-5 font-bold text-sm">{app.doctorName}</td>
                          <td className="px-8 py-5 text-sm text-gray-600">{app.dept}</td>
                          <td className="px-8 py-5">
                            <span className="w-8 h-8 rounded-full bg-[#F5F5F0] flex items-center justify-center text-xs font-bold text-[#5A5A40]">
                              {app.sequenceNum}
                            </span>
                          </td>
                          <td className="px-8 py-5 text-xs text-gray-400">{app.appointmentTime}</td>
                          <td className="px-8 py-5">
                            <div className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider ${app.status === 0 ? 'text-green-600' : 'text-red-400'}`}>
                              {app.status === 0 ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                              {app.status === 0 ? '有效' : '已取消'}
                            </div>
                          </td>
                          <td className="px-8 py-5 text-right">
                            {app.status === 0 && (
                              <button 
                                onClick={() => handleCancelAppointment(app.id)}
                                className="text-xs font-bold text-red-400 hover:text-red-600 transition-colors"
                              >
                                取消预约
                              </button>
                            )}
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan={7} className="px-8 py-20 text-center text-gray-400 italic text-sm">
                            {searchName ? '未找到相关预约记录' : '请输入姓名进行查询'}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </motion.div>
          ) : (
            <motion.div 
              key="admin"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-4xl mx-auto"
            >
              {!isAdminLoggedIn ? (
                <div className="bg-white p-12 rounded-[3rem] border border-[#141414]/5 shadow-2xl text-center">
                  <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-8">
                    <ShieldCheck size={40} />
                  </div>
                  <h2 className="text-3xl font-bold mb-2">管理员登录</h2>
                  <p className="text-gray-400 mb-8">请输入后台管理密码以继续</p>
                  <form onSubmit={handleAdminLogin} className="max-w-xs mx-auto space-y-4">
                    <input 
                      type="password" 
                      value={adminPassword}
                      onChange={e => setAdminPassword(e.target.value)}
                      placeholder="默认密码: 123"
                      className="w-full px-6 py-4 rounded-2xl bg-[#F5F5F0] border-none focus:ring-2 focus:ring-red-500 transition-all text-center text-lg"
                    />
                    <button 
                      type="submit"
                      className="w-full py-4 rounded-2xl bg-[#141414] text-white font-bold hover:bg-gray-800 transition-all"
                    >
                      进入系统
                    </button>
                  </form>
                </div>
              ) : (
                <div className="space-y-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-3xl font-bold">系统管理后台</h2>
                      <p className="text-sm text-gray-400">管理医生排班及系统设置</p>
                    </div>
                    <button 
                      onClick={() => setIsAdminLoggedIn(false)}
                      className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-white border border-gray-200 text-sm font-bold text-red-500 hover:bg-red-50 transition-all"
                    >
                      <LogOut size={18} />
                      退出登录
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Add Doctor Form */}
                    <div className="md:col-span-1 bg-white p-8 rounded-[2rem] border border-[#141414]/5 shadow-sm">
                      <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                        <Plus className="text-[#5A5A40]" size={20} />
                        添加新医生
                      </h3>
                      <form onSubmit={handleAddDoctor} className="space-y-4">
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">医生 ID</label>
                          <input 
                            type="number" required
                            value={newDoctorForm.id}
                            onChange={e => setNewDoctorForm({ ...newDoctorForm, id: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-xl bg-[#F5F5F0] border-none text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">姓名</label>
                          <input 
                            type="text" required
                            value={newDoctorForm.name}
                            onChange={e => setNewDoctorForm({ ...newDoctorForm, name: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-xl bg-[#F5F5F0] border-none text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">科室</label>
                          <input 
                            type="text" required
                            value={newDoctorForm.dept}
                            onChange={e => setNewDoctorForm({ ...newDoctorForm, dept: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-xl bg-[#F5F5F0] border-none text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">每日限额</label>
                          <input 
                            type="number" required
                            value={newDoctorForm.max_num}
                            onChange={e => setNewDoctorForm({ ...newDoctorForm, max_num: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-xl bg-[#F5F5F0] border-none text-sm"
                          />
                        </div>
                        <button 
                          type="submit"
                          className="w-full py-3 rounded-xl bg-[#5A5A40] text-white font-bold text-sm mt-4"
                        >
                          确认添加
                        </button>
                      </form>
                    </div>

                    {/* Doctor List Management */}
                    <div className="md:col-span-2 space-y-6">
                      <div className="bg-white p-8 rounded-[2rem] border border-[#141414]/5 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                          <h3 className="text-lg font-bold">医生列表管理</h3>
                          <button 
                            onClick={handleResetQuota}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-50 text-amber-600 text-xs font-bold hover:bg-amber-100 transition-all"
                          >
                            <RefreshCw size={14} />
                            重置所有号源
                          </button>
                        </div>
                        <div className="space-y-3">
                          {doctors.map(doc => (
                            <div key={doc.id} className="flex items-center justify-between p-4 rounded-2xl bg-[#F5F5F0]/50 border border-gray-100">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center font-bold text-[#5A5A40]">
                                  {doc.name[0]}
                                </div>
                                <div>
                                  <p className="font-bold text-sm">{doc.name}</p>
                                  <p className="text-[10px] text-gray-400 uppercase tracking-widest">{doc.dept} • ID: {doc.id}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-6">
                                <div className="text-right">
                                  <p className="text-xs font-bold">{doc.current_num}/{doc.max_num}</p>
                                  <p className="text-[8px] text-gray-400 uppercase">当前负荷</p>
                                </div>
                                <button 
                                  onClick={() => handleDeleteDoctor(doc.id)}
                                  className="p-2 text-red-300 hover:text-red-500 transition-colors"
                                >
                                  <Trash2 size={18} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-6 py-12 border-t border-[#141414]/5 text-center">
        <p className="text-xs text-gray-400 font-medium">© 2026 SZPU Hospital Management System. All rights reserved.</p>
      </footer>
      <Toaster position="top-center" richColors />
    </div>
  );
}
