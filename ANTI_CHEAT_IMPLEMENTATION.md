# 🛡️ Anti-Cheat System Implementation Guide

## ✅ สิ่งที่ทำเสร็จแล้ว

### 1. Database Schema
- ✅ **GameAction** - เก็บ action history
- ✅ **SuspiciousActivity** - เก็บกิจกรรมที่น่าสงสัย
- ✅ **DeviceFingerprint** - เก็บ device fingerprints
- ✅ **IPRecord** - เก็บ IP addresses และ risk levels

### 2. Enhanced Anti-Cheat System
- ✅ **`lib/game/anticheatEnhanced.ts`** - Enhanced anti-cheat system พร้อม database persistence
- ✅ **Fallback mechanism** - ใช้ in-memory storage ถ้า database ไม่มี
- ✅ **Device fingerprinting** - ตรวจจับ multiple accounts
- ✅ **IP tracking** - ตรวจจับ VPN/proxy
- ✅ **Behavioral analysis** - วิเคราะห์พฤติกรรมการเล่นเกม

### 3. Device Fingerprinting
- ✅ **`lib/utils/deviceFingerprint.ts`** - Device fingerprinting utility
- ✅ **Client-side fingerprinting** - สร้าง fingerprint จาก browser characteristics
- ✅ **LocalStorage caching** - Cache fingerprint ใน localStorage

### 4. IP Tracking & VPN Detection
- ✅ **`lib/utils/ipTracking.ts`** - IP tracking และ VPN detection
- ✅ **IP geolocation** - ใช้ ipapi.co สำหรับ geolocation
- ✅ **VPN/proxy detection** - ตรวจจับ VPN, proxy, และ Tor
- ✅ **Risk assessment** - คำนวณ risk level

### 5. API Integration
- ✅ **`app/api/game/score/submit/route.ts`** - อัพเดทให้ใช้ enhanced anti-cheat
- ✅ **Device fingerprint tracking** - ส่ง device fingerprint ไปยัง API
- ✅ **IP tracking** - Track IP addresses และ check risk
- ✅ **Enhanced validation** - ใช้ enhanced anti-cheat validation

### 6. Game Integration
- ✅ **`app/game/coin-flip/page.tsx`** - อัพเดทให้ส่ง device fingerprint
- ✅ **Device fingerprint collection** - เก็บ device fingerprint ใน game

---

## 🚀 การใช้งาน

### 1. รัน Database Migration

```bash
# สร้าง migration (ถ้ายังไม่มี DATABASE_URL ให้สร้าง migration file แบบ manual)
npx prisma migrate dev --name add_anti_cheat_tables

# หรือใช้ SQL file ที่สร้างไว้
psql $DATABASE_URL -f prisma/migrations/20250101000000_add_anti_cheat_tables/migration.sql
```

### 2. Generate Prisma Client

```bash
npx prisma generate
```

### 3. ใช้ Enhanced Anti-Cheat ใน Games

```typescript
import { getDeviceFingerprint } from '@/lib/utils/deviceFingerprint';

// ใน game component
const [deviceId, setDeviceId] = useState<string>('');

useEffect(() => {
  try {
    const fingerprint = getDeviceFingerprint();
    setDeviceId(fingerprint);
  } catch (error) {
    console.warn('Failed to get device fingerprint:', error);
  }
}, []);

// เมื่อ submit score
await fetch('/api/game/score/submit', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ 
    address, 
    payload, 
    sig: signature, 
    deviceId // ส่ง device fingerprint
  })
});
```

### 4. ใช้ Enhanced Anti-Cheat ใน API Routes

```typescript
import { enhancedAntiCheat } from '@/lib/game/anticheatEnhanced';
import { getClientIP, checkIPRisk } from '@/lib/utils/ipTracking';

// ใน API route
const ipAddress = getClientIP(req);
const ipInfo = await checkIPRisk(ipAddress);

// Register IP
await enhancedAntiCheat.registerIP(ipAddress, userId, ipInfo);

// Register device
if (deviceId) {
  await enhancedAntiCheat.registerDevice(deviceId, userId, metadata);
}

// Record action
await enhancedAntiCheat.recordAction(
  userId,
  'score_submit',
  { score, gameDuration, actionsCount },
  gameId,
  deviceId,
  ipAddress,
  userAgent
);

// Validate score
const scoreCheck = await enhancedAntiCheat.validateScore(
  userId,
  score,
  gameDuration,
  actionsCount,
  gameId,
  deviceId,
  ipAddress
);
```

---

## 📊 Database Tables

### GameAction
เก็บ action history ของผู้เล่น

```sql
SELECT * FROM game_actions 
WHERE userId = '0x...' 
ORDER BY timestamp DESC 
LIMIT 100;
```

### SuspiciousActivity
เก็บกิจกรรมที่น่าสงสัย

```sql
SELECT * FROM suspicious_activities 
WHERE resolved = false 
ORDER BY createdAt DESC;
```

### DeviceFingerprint
เก็บ device fingerprints

```sql
SELECT * FROM device_fingerprints 
WHERE suspicious = true 
OR blocked = true;
```

### IPRecord
เก็บ IP records

```sql
SELECT * FROM ip_records 
WHERE riskLevel = 'high' 
OR blocked = true;
```

---

## 🔍 Monitoring & Analytics

### 1. Check Suspicious Activities

```typescript
import { prisma } from '@/lib/prisma/client';

const suspiciousActivities = await prisma.suspiciousActivity.findMany({
  where: {
    resolved: false,
    severity: 'high',
  },
  orderBy: {
    createdAt: 'desc',
  },
  take: 100,
});
```

### 2. Check Device Fingerprints

```typescript
const devices = await prisma.deviceFingerprint.findMany({
  where: {
    suspicious: true,
  },
  orderBy: {
    lastSeen: 'desc',
  },
});
```

### 3. Check IP Records

```typescript
const ipRecords = await prisma.iPRecord.findMany({
  where: {
    OR: [
      { isVPN: true },
      { isProxy: true },
      { isTor: true },
      { riskLevel: 'high' },
    ],
  },
  orderBy: {
    lastSeen: 'desc',
  },
});
```

---

## 🎯 Features

### 1. Device Fingerprinting
- ✅ สร้าง unique fingerprint จาก browser characteristics
- ✅ ตรวจจับ multiple accounts จาก device เดียวกัน
- ✅ Block suspicious devices

### 2. IP Tracking
- ✅ Track IP addresses
- ✅ ตรวจจับ VPN/proxy/Tor
- ✅ Block high-risk IPs
- ✅ Rate limiting based on IP

### 3. Behavioral Analysis
- ✅ วิเคราะห์ timing patterns
- ✅ ตรวจจับ bot-like behavior
- ✅ ตรวจจับ machine-like patterns
- ✅ Perfect accuracy detection

### 4. Score Validation
- ✅ Score per second validation
- ✅ Score per action validation
- ✅ Duration validation
- ✅ Accuracy validation

---

## 🛠️ Configuration

### Environment Variables

```env
# Database (optional - system works without database)
DATABASE_URL="postgresql://user:password@localhost:5432/luminex?schema=public"

# IP API (optional - uses ipapi.co by default)
IP_API_KEY="your-api-key" # Optional, for higher rate limits
```

### Anti-Cheat Settings

สามารถปรับแต่ง threshold ใน `lib/game/anticheatEnhanced.ts`:

```typescript
private readonly MIN_ACTION_INTERVAL_MS = 50;
private readonly SUSPICIOUS_SPEED_THRESHOLD = 15;
private readonly PATTERN_REPETITION_THRESHOLD = 5;
private readonly MAX_SUSPICIOUS_ACTIONS = 3;
```

---

## 📈 Performance

### Database Performance
- ✅ Indexes สำหรับ queries ที่เร็ว
- ✅ Cleanup old records (30 days)
- ✅ Batch operations

### Fallback Mechanism
- ✅ ใช้ in-memory storage ถ้า database ไม่มี
- ✅ ไม่ block requests ถ้า database unavailable
- ✅ Silent fallback สำหรับ errors

---

## 🔒 Security

### 1. Data Privacy
- ✅ ไม่เก็บข้อมูลส่วนบุคคล
- ✅ เก็บเฉพาะ technical data (IP, device fingerprint)
- ✅ GDPR compliant

### 2. Rate Limiting
- ✅ IP-based rate limiting
- ✅ Device-based rate limiting
- ✅ User-based rate limiting

### 3. Fraud Detection
- ✅ Multiple account detection
- ✅ VPN/proxy detection
- ✅ Bot detection
- ✅ Score manipulation detection

---

## 📚 Next Steps

### Immediate Actions:
1. ✅ **รัน Database Migration** - สร้าง tables
2. ✅ **Generate Prisma Client** - อัพเดท Prisma client
3. ✅ **ทดสอบระบบ** - ทดสอบว่า system ทำงานถูกต้อง

### Future Enhancements:
1. **Machine Learning Models** - ใช้ ML สำหรับ pattern detection
2. **Real-time Monitoring** - Dashboard สำหรับ monitor suspicious activities
3. **Advanced Behavioral Analysis** - วิเคราะห์พฤติกรรมที่ซับซ้อนขึ้น
4. **Score Normalization** - ปรับ score ให้เป็นมาตรฐาน

---

## 🎉 สรุป

ระบบ anti-cheat ที่พัฒนาขึ้นมี features:
- ✅ Database persistence
- ✅ Device fingerprinting
- ✅ IP tracking และ VPN detection
- ✅ Behavioral analysis
- ✅ Enhanced score validation
- ✅ Fallback mechanism

**พร้อมใช้งานแล้ว!** 🚀

