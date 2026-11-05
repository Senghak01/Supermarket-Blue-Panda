import { Form, Input, Modal, Switch, message } from 'antd';
import { useState } from 'react';
import { addressApi } from '@/api';
import type { AddressResponse, CreateAddressRequest } from '@/types';
import { errorMessage } from '@/utils/errors';

interface Props {
  open: boolean;
  initial?: AddressResponse;
  onClose: () => void;
  onSaved: (address: AddressResponse) => void;
}

export default function AddressModal({ open, initial, onClose, onSaved }: Props) {
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm<CreateAddressRequest>();

  const submit = async () => {
    const values = await form.validateFields();
    setSaving(true);
    try {
      const { data } = initial ? await addressApi.update(initial.addressId, values) : await addressApi.create(values);
      message.success(initial ? 'Address updated' : 'Address saved');
      onSaved(data);
    } catch (err) {
      message.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title={initial ? 'Edit address' : 'New delivery address'}
      open={open}
      onCancel={onClose}
      onOk={submit}
      okText="Save address"
      confirmLoading={saving}
      destroyOnHidden
    >
      <Form
        form={form}
        layout="vertical"
        requiredMark={false}
        preserve={false}
        initialValues={initial ?? { label: 'Home', city: 'Phnom Penh', isDefault: false }}
      >
        <Form.Item name="label" label="Label" rules={[{ required: true, max: 30 }]}><Input placeholder="Home, Work…" /></Form.Item>
        <Form.Item name="recipientName" label="Recipient" rules={[{ required: true, max: 100, message: 'Who will receive the order?' }]}><Input /></Form.Item>
        <Form.Item name="phoneNumber" label="Phone number" rules={[{ required: true, max: 20, pattern: /^[+\d][\d\s\-()]{5,}$/, message: 'Enter a phone number the driver can call' }]}><Input inputMode="tel" /></Form.Item>
        <Form.Item name="addressLine" label="Street, house number" rules={[{ required: true, max: 255, message: 'Enter the street and house number' }]}><Input /></Form.Item>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Form.Item name="district" label="District / Sangkat" rules={[{ max: 100 }]}><Input /></Form.Item>
          <Form.Item name="city" label="City" rules={[{ required: true, max: 100 }]}><Input /></Form.Item>
        </div>
        <Form.Item name="note" label="Note for the driver" rules={[{ max: 255 }]}><Input.TextArea rows={2} placeholder="Gate colour, landmark…" /></Form.Item>
        <Form.Item name="isDefault" label="Use as my default address" valuePropName="checked"><Switch /></Form.Item>
      </Form>
    </Modal>
  );
}
