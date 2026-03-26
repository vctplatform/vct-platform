'use client'
import * as React from 'react'
import { VCT_Icons } from '@vct/ui'

export const Page_public_members = () => {
  return (
    <div className="w-full animation-fade-in relative z-10 flex flex-col items-center justify-center min-h-[60vh]">
      <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6">
        <VCT_Icons.Wrench className="text-emerald-500 w-10 h-10" />
      </div>
      <h1 className="text-3xl lg:text-4xl font-black mb-4 tracking-tight drop-shadow-sm">Tra Cứu Môn Sinh</h1>
      <p className="text-slate-400 max-w-md text-center leading-relaxed">
        Chức năng tra cứu thông tin hồ sơ, cấp bậc đai và lịch sử thi đấu của môn sinh đang trong quá trình hoàn thiện.
      </p>
    </div>
  )
}
