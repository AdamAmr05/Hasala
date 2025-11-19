import React from 'react';
import { FamilyMember } from '../../types';

const FamilyView: React.FC = () => {
  const members: FamilyMember[] = [
    { id: '1', name: 'Dad', avatar: 'https://picsum.photos/id/1005/100/100', monthlySpend: 15000, status: 'safe' },
    { id: '2', name: 'Mom', avatar: 'https://picsum.photos/id/1011/100/100', monthlySpend: 12000, status: 'safe' },
    { id: '3', name: 'Omar (Brother)', avatar: 'https://picsum.photos/id/1025/100/100', monthlySpend: 4500, status: 'warning' },
  ];

  return (
    <div className="pt-8 px-6 pb-24 space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Family Sync</h1>
      <p className="text-subtext">Monitor your family's financial health.</p>

      <div className="grid grid-cols-1 gap-4">
        {members.map(member => (
          <div key={member.id} className="bg-white rounded-3xl p-4 shadow-apple flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <img src={member.avatar} alt={member.name} className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-sm" />
                <div className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white ${
                  member.status === 'safe' ? 'bg-success' : member.status === 'warning' ? 'bg-warning' : 'bg-danger'
                }`}></div>
              </div>
              <div>
                <h3 className="font-bold text-gray-800">{member.name}</h3>
                <p className="text-xs text-subtext">Spent this month</p>
              </div>
            </div>
            <div className="text-right">
              <span className="block font-bold text-lg text-gray-900">{member.monthlySpend.toLocaleString()}</span>
              <span className="text-xs text-subtext">EGP</span>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-3xl p-6 border border-blue-100">
        <div className="flex items-start gap-3">
          <div className="bg-white p-2 rounded-xl shadow-sm text-primary">
             <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
          </div>
          <div>
            <h4 className="font-bold text-primary mb-1">Guardian View</h4>
            <p className="text-sm text-gray-600 leading-relaxed">
              You have view-only access to Omar's account. His spending on 'Entertainment' is 20% higher than last month.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FamilyView;