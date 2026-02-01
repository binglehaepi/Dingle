import React, { useEffect, useRef, useState } from 'react';
import { ScrapType, ScrapMetadata } from '../types';
import { compressImage } from '../services/imageUtils';

interface CreationModalProps {
  onConfirm: (type: ScrapType, metadata: ScrapMetadata) => void;
  onCancel: () => void;
}

const CreationModal: React.FC<CreationModalProps> = ({ onConfirm, onCancel }) => {
  const [activeTab, setActiveTab] = useState<'ticket' | 'boarding' | 'receipt' | 'toploader' | 'cupsleeve' | 'fashion' | 'note' | 'gif'>('ticket');

  // Ticket State
  const [movieTitle, setMovieTitle] = useState('');
  const [movieDate, setMovieDate] = useState('');
  const [movieTime, setMovieTime] = useState('');
  const [movieSeat, setMovieSeat] = useState('');
  const [cinemaName, setCinemaName] = useState('CGV');
  const [posterUrl, setPosterUrl] = useState('');

  // Boarding State
  const [fromCity, setFromCity] = useState('SEL');
  const [toCity, setToCity] = useState('JFK');
  const [flightDate, setFlightDate] = useState('');
  const [flightNo, setFlightNo] = useState('KE081');
  const [gate, setGate] = useState('23A');
  const [flightSeat, setFlightSeat] = useState('14F');
  const [airlineColor, setAirlineColor] = useState('#0284c7');

  // Receipt State
  const [receiptDate, setReceiptDate] = useState('');
  const [items, setItems] = useState([{ name: 'Coffee', price: '5.0' }]);

  // Fandom/Fashion Items State
  const [uploadedImage, setUploadedImage] = useState<string>('');
  const [uploadedVideo, setUploadedVideo] = useState<string>('');
  const [fandomTitle, setFandomTitle] = useState('');
  const [cafeName, setCafeName] = useState('');
  const [eventDate, setEventDate] = useState('');
  
  // Fashion State
  const [brandName, setBrandName] = useState('');
  const [price, setPrice] = useState('₩ 0');
  const [size, setSize] = useState('M');

  // Note State
  const [noteText, setNoteText] = useState('');
  const [noteSize, setNoteSize] = useState<'normal' | 'large' | 'small'>('normal');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaInputRef = useRef<HTMLInputElement>(null);

  // ✅ ObjectURL cleanup: 미리보기 URL(blob:)은 변경/언마운트 시 revoke
  useEffect(() => {
    if (!uploadedImage || !uploadedImage.startsWith('blob:')) return;
    return () => {
      try {
        URL.revokeObjectURL(uploadedImage);
      } catch {
        // ignore
      }
    };
  }, [uploadedImage]);

  useEffect(() => {
    if (!uploadedVideo || !uploadedVideo.startsWith('blob:')) return;
    return () => {
      try {
        URL.revokeObjectURL(uploadedVideo);
      } catch {
        // ignore
      }
    };
  }, [uploadedVideo]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      try {
          // Compress uploaded image
          const result = await compressImage(e.target.files[0], 600, 0.7);
          setUploadedImage(result);
      } catch (err) {
          console.error("Compression failed", err);
      }
    }
  };

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          const url = URL.createObjectURL(file);
          
          if (file.type.startsWith('video/')) {
              setUploadedVideo(url);
              setUploadedImage('');
          } else {
              setUploadedImage(url);
              setUploadedVideo('');
          }
      }
  };

  const handleCreate = () => {
      let type = ScrapType.GENERAL;
      let metadata: ScrapMetadata = { title: '', url: '', isEditable: false };

      if (activeTab === 'ticket') {
          type = ScrapType.TICKET;
          metadata = {
              title: movieTitle || "Untitled Movie",
              subtitle: "Cinema Ticket",
              url: "",
              imageUrl: posterUrl || "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=800&q=80",
              ticketConfig: {
                  date: movieDate,
                  time: movieTime,
                  seat: movieSeat,
                  cinema: cinemaName
              }
          };
      } else if (activeTab === 'boarding') {
          type = ScrapType.BOARDING;
          metadata = {
              title: `${fromCity} to ${toCity}`,
              subtitle: "Boarding Pass",
              url: "",
              boardingConfig: {
                  from: fromCity,
                  to: toCity,
                  date: flightDate,
                  flight: flightNo,
                  gate: gate,
                  seat: flightSeat,
                  color: airlineColor
              }
          };
      } else if (activeTab === 'receipt') {
          type = ScrapType.RECEIPT;
          const totalVal = items.reduce((sum, item) => sum + parseFloat(item.price || '0'), 0);
          metadata = {
              title: "Receipt",
              subtitle: receiptDate,
              url: "",
              receiptConfig: {
                  date: receiptDate,
                  items: items,
                  total: totalVal.toFixed(2)
              }
          };
      } else if (activeTab === 'toploader') {
          type = ScrapType.TOPLOADER;
          metadata = {
              title: fandomTitle || "My Bias",
              subtitle: "Digital Toploader",
              url: "",
              imageUrl: uploadedImage || "https://via.placeholder.com/300x400?text=No+Image",
              toploaderConfig: {
                  stickers: [] 
              }
          };
      } else if (activeTab === 'cupsleeve') {
          type = ScrapType.CUPSLEEVE;
          metadata = {
              title: fandomTitle || "Happy Birthday",
              subtitle: "Cafe Event",
              url: "",
              imageUrl: uploadedImage || "https://via.placeholder.com/600x300?text=Sleeve+Design",
              cupSleeveConfig: {
                  cafeName: cafeName || "Cafe",
                  eventDate: eventDate || new Date().toISOString().split('T')[0]
              }
          };
      } else if (activeTab === 'fashion') {
          type = ScrapType.FASHION;
          metadata = {
              title: fandomTitle || "Item Name",
              subtitle: brandName,
              url: "",
              imageUrl: uploadedImage || "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80",
              fashionConfig: {
                  brand: brandName || "BRAND",
                  price: price,
                  size: size
              }
          };
      } else if (activeTab === 'note') {
          type = ScrapType.NOTE;
          metadata = {
              title: "Text Note",
              subtitle: "",
              url: "",
              noteConfig: {
                  text: noteText || "Write your story...",
                  fontSize: noteSize
              }
          };
      } else if (activeTab === 'gif') {
          type = ScrapType.MOVING_PHOTO;
          metadata = {
              title: fandomTitle || "Moving Photo",
              subtitle: uploadedVideo ? "Video Loop" : "Animated",
              url: "",
              imageUrl: uploadedImage,
              videoUrl: uploadedVideo,
              isEditable: true
          };
      }

      onConfirm(type, metadata);
  };

  const handleReceiptItemChange = (idx: number, field: 'name' | 'price', value: string) => {
      const newItems = [...items];
      newItems[idx] = { ...newItems[idx], [field]: value };
      setItems(newItems);
  };

  const addReceiptItem = () => {
      setItems([...items, { name: '', price: '' }]);
  };

  return (
    <div 
      className="fixed inset-0 z-[20000] flex items-center justify-center p-4"
      onClick={onCancel}
      style={{ pointerEvents: 'auto' }}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-t-2xl overflow-x-auto scrollbar-hide">
            {(['ticket', 'boarding', 'receipt', 'toploader', 'cupsleeve', 'fashion', 'note', 'gif'] as const).map(tab => (
                <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-2 px-3 text-xs font-bold uppercase rounded-xl transition-all whitespace-nowrap ${activeTab === tab ? 'bg-white shadow text-slate-800' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    {tab}
                </button>
            ))}
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto flex-1">
            {activeTab === 'ticket' && (
                <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-2">
                        <label className="text-xs font-bold text-slate-500">Movie Title</label>
                        <input className="input-field" placeholder="Inception" value={movieTitle} onChange={e => setMovieTitle(e.target.value)} />
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                        <label className="text-xs font-bold text-slate-500">Poster Image URL</label>
                        <input className="input-field" placeholder="https://..." value={posterUrl} onChange={e => setPosterUrl(e.target.value)} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                             <label className="text-xs font-bold text-slate-500">Date</label>
                             <input type="date" className="input-field" value={movieDate} onChange={e => setMovieDate(e.target.value)} />
                        </div>
                        <div>
                             <label className="text-xs font-bold text-slate-500">Time</label>
                             <input type="time" className="input-field" value={movieTime} onChange={e => setMovieTime(e.target.value)} />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                             <label className="text-xs font-bold text-slate-500">Seat</label>
                             <input className="input-field" placeholder="G12" value={movieSeat} onChange={e => setMovieSeat(e.target.value)} />
                        </div>
                        <div>
                             <label className="text-xs font-bold text-slate-500">Cinema</label>
                             <input className="input-field" placeholder="IMAX" value={cinemaName} onChange={e => setCinemaName(e.target.value)} />
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'boarding' && (
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                         <div>
                            <label className="text-xs font-bold text-slate-500">From (Code)</label>
                            <input className="input-field uppercase" maxLength={3} value={fromCity} onChange={e => setFromCity(e.target.value)} />
                         </div>
                         <div>
                            <label className="text-xs font-bold text-slate-500">To (Code)</label>
                            <input className="input-field uppercase" maxLength={3} value={toCity} onChange={e => setToCity(e.target.value)} />
                         </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                         <div>
                            <label className="text-xs font-bold text-slate-500">Flight No</label>
                            <input className="input-field" value={flightNo} onChange={e => setFlightNo(e.target.value)} />
                         </div>
                         <div>
                            <label className="text-xs font-bold text-slate-500">Date</label>
                            <input type="date" className="input-field" value={flightDate} onChange={e => setFlightDate(e.target.value)} />
                         </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        <div>
                            <label className="text-xs font-bold text-slate-500">Gate</label>
                            <input className="input-field" value={gate} onChange={e => setGate(e.target.value)} />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500">Seat</label>
                            <input className="input-field" value={flightSeat} onChange={e => setFlightSeat(e.target.value)} />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500">Color</label>
                            <input type="color" className="w-full h-10 rounded cursor-pointer" value={airlineColor} onChange={e => setAirlineColor(e.target.value)} />
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'receipt' && (
                <div className="space-y-4">
                    <div>
                         <label className="text-xs font-bold text-slate-500">Date</label>
                         <input type="date" className="input-field" value={receiptDate} onChange={e => setReceiptDate(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500">Items</label>
                        {items.map((item, idx) => (
                            <div key={idx} className="flex gap-2">
                                <input className="input-field flex-1" placeholder="Item Name" value={item.name} onChange={e => handleReceiptItemChange(idx, 'name', e.target.value)} />
                                <input className="input-field w-20" placeholder="0.00" type="number" value={item.price} onChange={e => handleReceiptItemChange(idx, 'price', e.target.value)} />
                            </div>
                        ))}
                        <button onClick={addReceiptItem} className="text-xs text-purple-600 font-bold hover:underline">+ Add Item</button>
                    </div>
                </div>
            )}

            {(activeTab === 'toploader' || activeTab === 'cupsleeve' || activeTab === 'fashion') && (
                <div className="space-y-4">
                    <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                        {uploadedImage ? (
                            <img src={uploadedImage} alt="Preview" className="h-32 object-contain rounded shadow-sm" />
                        ) : (
                            <>
                                <span className="text-2xl mb-2">📸</span>
                                <span className="text-xs font-bold text-slate-500">Upload Photo / Design</span>
                            </>
                        )}
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                    </div>

                    <div className="grid grid-cols-1 gap-2">
                        <label className="text-xs font-bold text-slate-500">{activeTab === 'fashion' ? 'Item Name' : 'Title / Name'}</label>
                        <input className="input-field" placeholder={activeTab === 'toploader' ? "My Bias Name" : "Name"} value={fandomTitle} onChange={e => setFandomTitle(e.target.value)} />
                    </div>

                    {activeTab === 'cupsleeve' && (
                        <>
                             <div className="grid grid-cols-1 gap-2">
                                <label className="text-xs font-bold text-slate-500">Cafe Name</label>
                                <input className="input-field" placeholder="Cafe Name" value={cafeName} onChange={e => setCafeName(e.target.value)} />
                             </div>
                             <div className="grid grid-cols-1 gap-2">
                                <label className="text-xs font-bold text-slate-500">Event Date</label>
                                <input type="date" className="input-field" value={eventDate} onChange={e => setEventDate(e.target.value)} />
                             </div>
                        </>
                    )}

                    {activeTab === 'fashion' && (
                        <>
                             <div className="grid grid-cols-1 gap-2">
                                <label className="text-xs font-bold text-slate-500">Brand Name</label>
                                <input className="input-field" placeholder="MUSINSA STANDARD" value={brandName} onChange={e => setBrandName(e.target.value)} />
                             </div>
                             <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-500">Price</label>
                                    <input className="input-field" placeholder="₩ 39,000" value={price} onChange={e => setPrice(e.target.value)} />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500">Size</label>
                                    <input className="input-field" placeholder="M" value={size} onChange={e => setSize(e.target.value)} />
                                </div>
                             </div>
                        </>
                    )}
                </div>
            )}

            {activeTab === 'note' && (
                <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-2">
                        <label className="text-xs font-bold text-slate-500">Handwritten Note</label>
                        <textarea 
                            className="input-field min-h-[150px] font-handwriting text-xl resize-none bg-yellow-50/50" 
                            placeholder="Write your diary entry..." 
                            value={noteText} 
                            onChange={e => setNoteText(e.target.value)} 
                        />
                    </div>
                    <div className="flex gap-4">
                         {['small', 'normal', 'large'].map(s => (
                             <button 
                                key={s}
                                onClick={() => setNoteSize(s as any)}
                                className={`flex-1 py-2 rounded-lg border text-xs font-bold uppercase transition-colors ${noteSize === s ? 'bg-slate-800 text-white border-slate-800' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-400'}`}
                             >
                                 {s}
                             </button>
                         ))}
                    </div>
                </div>
            )}

            {activeTab === 'gif' && (
                <div className="space-y-4">
                     <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer" onClick={() => mediaInputRef.current?.click()}>
                        {uploadedImage || uploadedVideo ? (
                            <div className="h-32 rounded shadow-sm overflow-hidden flex items-center justify-center bg-black">
                                {uploadedVideo ? (
                                    <video src={uploadedVideo} className="h-full w-auto" autoPlay loop muted playsInline />
                                ) : (
                                    <img src={uploadedImage} alt="Preview" className="h-full w-auto" />
                                )}
                            </div>
                        ) : (
                            <>
                                <span className="text-2xl mb-2">🎞️</span>
                                <span className="text-xs font-bold text-slate-500">Upload GIF / WebP / MP4</span>
                            </>
                        )}
                        <input type="file" ref={mediaInputRef} className="hidden" accept="image/gif,image/webp,video/mp4" onChange={handleMediaChange} />
                    </div>
                    
                    <div className="grid grid-cols-1 gap-2">
                        <label className="text-xs font-bold text-slate-500">Title</label>
                        <input className="input-field" placeholder="My GIF" value={fandomTitle} onChange={e => setFandomTitle(e.target.value)} />
                    </div>

                    <p className="text-[10px] text-slate-400">
                        Supports animated GIFs, WebP, and short MP4 loops. <br/>
                        Videos will autoplay on hover.
                    </p>
                </div>
            )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t flex justify-end gap-2">
            <button onClick={onCancel} className="px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-700">Cancel</button>
            <button onClick={handleCreate} className="px-6 py-2 text-sm font-bold text-white bg-slate-900 rounded-full hover:bg-slate-800 shadow-lg">
                Create {activeTab === 'note' ? 'Note' : activeTab === 'gif' ? 'Moving Photo' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
            </button>
        </div>
      </div>
      
      <style>{`
        .input-field {
            width: 100%;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 0.5rem;
            padding: 0.5rem 0.75rem;
            font-size: 0.875rem;
            outline: none;
        }
        .input-field:focus {
            border-color: #a855f7;
            background: white;
        }
        .scrollbar-hide::-webkit-scrollbar {
            display: none;
        }
      `}</style>
    </div>
  );
};

export default CreationModal;