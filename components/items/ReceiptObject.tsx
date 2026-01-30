import React from 'react';
import { ScrapMetadata } from '../../types';

interface ReceiptObjectProps {
  data: ScrapMetadata;
}

const ReceiptObject: React.FC<ReceiptObjectProps> = ({ data }) => {
  const { receiptConfig } = data;

  return (
    <div className="w-64 animate-receipt filter drop-shadow-xl">
        <div className="bg-[#eee] p-4 pb-6 receipt-bottom relative min-h-[300px] flex flex-col">
            {/* Paper Texture */}
            <div className="texture-overlay opacity-30"></div>
            
            <div className="text-center mb-4 border-b-2 border-dashed border-slate-300 pb-2">
                <h3 className="font-receipt text-3xl text-slate-800 uppercase font-bold tracking-tight">RECEIPT</h3>
                <p className="font-receipt text-lg text-slate-500">{receiptConfig?.date}</p>
                <p className="font-receipt text-sm text-slate-400 mt-1">Order # {Math.floor(Math.random() * 9999)}</p>
            </div>

            <div className="flex-1">
                {receiptConfig?.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-end mb-1 font-receipt text-xl text-slate-700">
                        <span className="truncate w-32 text-left">{item.name}</span>
                        <span className="border-b border-dotted border-slate-400 flex-1 mx-1 mb-1 opacity-50"></span>
                        <span>{item.price}</span>
                    </div>
                ))}
            </div>

            <div className="mt-4 pt-2 border-t-2 border-slate-800 border-dashed">
                <div className="flex justify-between font-receipt text-2xl font-bold text-slate-900">
                    <span>TOTAL</span>
                    <span>{receiptConfig?.total}</span>
                </div>
            </div>

            <div className="mt-6 text-center">
                 <span className="font-barcode text-5xl text-slate-800 opacity-70">THANK YOU</span>
                 <p className="font-receipt text-sm text-slate-500 mt-2">Have a nice day!</p>
            </div>
        </div>
    </div>
  );
};

export default ReceiptObject;