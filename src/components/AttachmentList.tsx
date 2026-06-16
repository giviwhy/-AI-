import { useState, useEffect } from 'react';
import { Paperclip, Upload, X, FileText, Image, Link as LinkIcon, Download, Trash2 } from 'lucide-react';

interface Attachment {
  id: number;
  taskId: number;
  fileName: string;
  filePath: string;
  fileType: string;
  uploaderId: number;
  uploaderName: string;
  createdAt: string;
}

interface AttachmentListProps {
  taskId: number;
  canUpload?: boolean;
}

export default function AttachmentList({ taskId, canUpload = true }: AttachmentListProps) {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [newFilePath, setNewFilePath] = useState('');
  const [newFileType, setNewFileType] = useState('link');

  useEffect(() => {
    fetchAttachments();
  }, [taskId]);

  const fetchAttachments = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch(`/api/tasks/${taskId}/attachments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setAttachments(data);
      }
    } catch (error) {
      console.error('Failed to fetch attachments:', error);
    }
  };

  const handleUpload = async () => {
    if (!newFileName.trim() || !newFilePath.trim()) {
      alert('请填写文件名和文件链接');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch(`/api/tasks/${taskId}/attachments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fileName: newFileName,
          filePath: newFilePath,
          fileType: newFileType,
        }),
      });

      if (response.ok) {
        setShowUploadModal(false);
        setNewFileName('');
        setNewFilePath('');
        setNewFileType('link');
        fetchAttachments();
      } else {
        alert('上传失败');
      }
    } catch (error) {
      console.error('Failed to upload:', error);
      alert('上传失败');
    }
  };

  const handleDelete = async (attachmentId: number) => {
    if (!confirm('确定要删除此附件吗？')) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch(`/api/attachments/${attachmentId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        fetchAttachments();
      } else {
        const error = await response.json();
        alert(error.message || '删除失败');
      }
    } catch (error) {
      console.error('Failed to delete:', error);
      alert('删除失败');
    }
  };

  const getFileIcon = (fileName: string, fileType: string) => {
    if (fileType === 'image' || /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(fileName)) {
      return <Image size={20} className="text-green-500" />;
    }
    if (/\.(pdf|doc|docx|xls|xlsx|ppt|pptx)$/i.test(fileName)) {
      return <FileText size={20} className="text-blue-500" />;
    }
    return <LinkIcon size={20} className="text-gray-500" />;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <Paperclip size={16} />
          附件 ({attachments.length})
        </h4>
        {canUpload && (
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <Upload size={14} />
            上传
          </button>
        )}
      </div>

      {attachments.length > 0 ? (
        <div className="space-y-2">
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {getFileIcon(attachment.fileName, attachment.fileType)}
                <div className="flex-1 min-w-0">
                  <a
                    href={attachment.filePath}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-blue-600 hover:text-blue-800 truncate block"
                  >
                    {attachment.fileName}
                  </a>
                  <div className="text-xs text-gray-500">
                    上传者: {attachment.uploaderName} · {new Date(attachment.createdAt).toLocaleDateString('zh-CN')}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 ml-2">
                <a
                  href={attachment.filePath}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 text-gray-500 hover:bg-gray-200 rounded-lg transition-colors"
                  title="下载/查看"
                >
                  <Download size={16} />
                </a>
                {canUpload && (
                  <button
                    onClick={() => handleDelete(attachment.id)}
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="删除"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500 text-center py-4">暂无附件</p>
      )}

      {/* 上传弹窗 */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-800">添加附件</h3>
              <button onClick={() => setShowUploadModal(false)} className="p-1 hover:bg-gray-100 rounded-full">
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  文件名 *
                </label>
                <input
                  type="text"
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="例如：项目报告.pdf"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  文件链接 *
                </label>
                <input
                  type="url"
                  value={newFilePath}
                  onChange={(e) => setNewFilePath(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  文件类型
                </label>
                <select
                  value={newFileType}
                  onChange={(e) => setNewFileType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="link">链接</option>
                  <option value="document">文档</option>
                  <option value="image">图片</option>
                  <option value="other">其他</option>
                </select>
              </div>
              <p className="text-xs text-gray-500">
                提示：请先上传文件到云盘（如百度网盘、OneDrive等），然后粘贴分享链接。
              </p>
            </div>
            <div className="flex gap-3 p-4 border-t">
              <button
                onClick={() => setShowUploadModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleUpload}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                添加
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}