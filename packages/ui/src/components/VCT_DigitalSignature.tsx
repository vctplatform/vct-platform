import React, { useRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { VCT_Modal } from './vct-ui-overlay';
import { VCT_Button, VCT_Stack } from './vct-ui-layout';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSignComplete: (signatureUrl: string) => void;
    documentTitle?: string;
}

export function VCT_DigitalSignature({ isOpen, onClose, onSignComplete, documentTitle = 'Văn bản Phê duyệt' }: Props) {
    const sigCanvas = useRef<SignatureCanvas>(null);

    const handleClear = () => {
        sigCanvas.current?.clear();
    };

    const handleSave = () => {
        if (sigCanvas.current?.isEmpty()) {
            alert('Vui lòng tạo chữ ký trước khi xác nhận');
            return;
        }
        const dataUrl = sigCanvas.current?.getTrimmedCanvas().toDataURL('image/png');
        if (dataUrl) {
            onSignComplete(dataUrl);
        }
    };

    return (
        <VCT_Modal
            isOpen={isOpen}
            onClose={onClose}
            title={"Ký số & Phê duyệt: " + documentTitle}
            width="600px"
            footer={
                <>
                    <VCT_Button variant="secondary" onClick={handleClear}>Xóa chữ ký</VCT_Button>
                    <VCT_Button variant="secondary" onClick={onClose}>Hủy</VCT_Button>
                    <VCT_Button onClick={handleSave}>Xác nhận & Ký</VCT_Button>
                </>
            }
        >
            <VCT_Stack gap={16}>
                <p className="text-sm text-(--vct-text-secondary)">
                    Vui lòng sử dụng chuột hoặc cảm ứng để ký tên vào khung dưới đây. Chữ ký sẽ được xác thực và đính kèm vào biên bản PDF.
                </p>
                <div className="border-2 border-dashed border-(--vct-border-subtle) rounded-xl overflow-hidden bg-white/5 relative">
                    <SignatureCanvas
                        ref={sigCanvas}
                        penColor="black"
                        canvasProps={{ width: 550, height: 250, className: 'sigCanvas cursor-crosshair' }}
                        backgroundColor="rgba(255, 255, 255, 0.9)"
                    />
                    <div className="absolute bottom-4 left-4 text-xs text-gray-400 pointer-events-none">
                        Vùng ký tên
                    </div>
                </div>
            </VCT_Stack>
        </VCT_Modal>
    );
}
