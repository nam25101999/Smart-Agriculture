import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), 'backend/.env') });

async function test() {
  try {
    console.log('1. Logging in as Admin...');
    const loginRes = await fetch('http://127.0.0.1:5000/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@smartagri.vn',
        password: 'Admin@123456',
      }),
    });
    const loginData: any = await loginRes.json();
    if (!loginRes.ok) throw new Error(JSON.stringify(loginData));
    const token = loginData.data.accessToken;
    console.log('Token acquired successfully.');

    console.log('2. Testing POST /api/v1/farms...');
    const createRes = await fetch('http://127.0.0.1:5000/api/v1/farms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: 'Nông trại Thử nghiệm 5000',
        code: `FARM_5000_${Date.now()}`,
        location: 'Đà Lạt, Lâm Đồng',
        description: 'Tạo từ script test',
      }),
    });
    const createData: any = await createRes.json();
    if (!createRes.ok) throw new Error(JSON.stringify(createData));
    console.log('Farm created successfully:', createData.data);

    console.log('3. Getting farms list...');
    const listRes = await fetch('http://127.0.0.1:5000/api/v1/farms', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const listData: any = await listRes.json();
    console.log(`Farms count: ${listData.data.length}`);
    console.log('SUCCESS!');
  } catch (err: any) {
    console.error('Test failed:', err.message, err.cause);
  }
}

test();
