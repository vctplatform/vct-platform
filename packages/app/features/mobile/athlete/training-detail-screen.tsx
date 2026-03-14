import * as React from 'react'
import { ScrollView, Text, View } from 'react-native'
import { useRouter, useSearchParams } from 'solito/navigation'
import { Colors, SharedStyles, FontWeight, Radius, Space } from '../mobile-theme'
import { Badge, ScreenHeader, ScreenSkeleton, EmptyState } from '../mobile-ui'
import { Icon, VCTIcons } from '../icons'
import { useAthleteTraining } from '../useAthleteData'
import { SESSION_TYPE_CFG, SESSION_STATUS_CFG } from '../mock-data'

// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — Training Detail Screen
// Session info: type, coach, location, time, attendance, notes
// ═══════════════════════════════════════════════════════════════

const SESSION_ICONS: Record<string, React.ComponentProps<typeof Icon>['name']> = {
  'regular': VCTIcons.calendar,
  'sparring': VCTIcons.flash,
  'exam': VCTIcons.trophy,
  'special': VCTIcons.starOutline,
}

export function TrainingDetailMobileScreen() {
  const router = useRouter()
  const params = useSearchParams()
  const id = params?.get?.('id') ?? ''
  const { data, isLoading } = useAthleteTraining()

  if (isLoading || !data) return <ScreenSkeleton />

  const session = data.sessions.find(s => s.id === id)
  if (!session) {
    return (
      <View style={[SharedStyles.page, SharedStyles.scrollContent]}>
        <ScreenHeader title="Chi tiết buổi tập" subtitle="" icon={VCTIcons.calendar} onBack={() => router.back()} />
        <EmptyState icon={VCTIcons.calendar} title="Không tìm thấy" message="Buổi tập không tồn tại." />
      </View>
    )
  }

  const typeCfg = SESSION_TYPE_CFG[session.type] ?? SESSION_TYPE_CFG['regular']!
  const statusCfg = SESSION_STATUS_CFG[session.status] ?? SESSION_STATUS_CFG['scheduled']!
  const iconName = SESSION_ICONS[session.type] ?? VCTIcons.calendar

  return (
    <ScrollView
      style={SharedStyles.page}
      contentContainerStyle={SharedStyles.scrollContent}
    >
      <ScreenHeader title="Chi tiết buổi tập" subtitle={typeCfg.label} icon={iconName} onBack={() => router.back()} />

      {/* Session card */}
      <View style={[SharedStyles.card, { borderColor: Colors.overlay(typeCfg.color, 0.2) }]}>
        <View style={[SharedStyles.rowBetween, { marginBottom: 12 }]}>
          <View style={[SharedStyles.row, { gap: 8 }]}>
            <Icon name={iconName} size={22} color={typeCfg.color} />
            <Text style={{ fontSize: 16, fontWeight: FontWeight.extrabold, color: typeCfg.color }}>{typeCfg.label}</Text>
          </View>
          <Badge label={statusCfg.label} bg={statusCfg.bg} fg={statusCfg.fg} />
        </View>

        {/* Info rows */}
        <View style={{ gap: 12 }}>
          <View style={[SharedStyles.row, { gap: 10 }]}>
            <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: Colors.overlay(Colors.accent, 0.08), justifyContent: 'center', alignItems: 'center' }}>
              <Icon name={VCTIcons.time} size={16} color={Colors.accent} />
            </View>
            <View>
              <Text style={{ fontSize: 11, color: Colors.textSecondary, fontWeight: FontWeight.semibold }}>Thời gian</Text>
              <Text style={{ fontSize: 14, fontWeight: FontWeight.bold, color: Colors.textPrimary }}>{session.time}</Text>
            </View>
          </View>

          <View style={[SharedStyles.row, { gap: 10 }]}>
            <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: Colors.overlay(Colors.green, 0.08), justifyContent: 'center', alignItems: 'center' }}>
              <Icon name={VCTIcons.calendar} size={16} color={Colors.green} />
            </View>
            <View>
              <Text style={{ fontSize: 11, color: Colors.textSecondary, fontWeight: FontWeight.semibold }}>Ngày</Text>
              <Text style={{ fontSize: 14, fontWeight: FontWeight.bold, color: Colors.textPrimary }}>{session.date}</Text>
            </View>
          </View>

          <View style={[SharedStyles.row, { gap: 10 }]}>
            <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: Colors.overlay(Colors.purple, 0.08), justifyContent: 'center', alignItems: 'center' }}>
              <Icon name={VCTIcons.location} size={16} color={Colors.purple} />
            </View>
            <View>
              <Text style={{ fontSize: 11, color: Colors.textSecondary, fontWeight: FontWeight.semibold }}>Địa điểm</Text>
              <Text style={{ fontSize: 14, fontWeight: FontWeight.bold, color: Colors.textPrimary }}>{session.location}</Text>
            </View>
          </View>

          <View style={[SharedStyles.row, { gap: 10 }]}>
            <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: Colors.overlay(Colors.gold, 0.08), justifyContent: 'center', alignItems: 'center' }}>
              <Icon name={VCTIcons.person} size={16} color={Colors.gold} />
            </View>
            <View>
              <Text style={{ fontSize: 11, color: Colors.textSecondary, fontWeight: FontWeight.semibold }}>Huấn luyện viên</Text>
              <Text style={{ fontSize: 14, fontWeight: FontWeight.bold, color: Colors.textPrimary }}>{session.coach}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Attendance status */}
      <Text style={SharedStyles.sectionTitle}>Trạng thái điểm danh</Text>
      <View style={[SharedStyles.card, { alignItems: 'center', paddingVertical: Space.xxl }]}>
        <View style={{
          width: 64, height: 64, borderRadius: 32,
          backgroundColor: statusCfg.bg, justifyContent: 'center', alignItems: 'center',
          marginBottom: 12,
        }}>
          <Icon
            name={session.status === 'completed' ? VCTIcons.checkmark : session.status === 'absent' ? VCTIcons.alert : VCTIcons.time}
            size={28}
            color={statusCfg.fg}
          />
        </View>
        <Text style={{ fontSize: 16, fontWeight: FontWeight.extrabold, color: statusCfg.fg }}>{statusCfg.label}</Text>
        <Text style={{ fontSize: 12, color: Colors.textSecondary, marginTop: 4, textAlign: 'center' }}>
          {session.status === 'completed' ? 'Bạn đã tham gia buổi tập này.'
            : session.status === 'absent' ? 'Bạn đã vắng mặt buổi tập này.'
            : session.status === 'cancelled' ? 'Buổi tập này đã bị hủy.'
            : 'Buổi tập này chưa diễn ra.'}
        </Text>
      </View>

      {/* Exercise checklist placeholder */}
      <Text style={SharedStyles.sectionTitle}>Nội dung tập luyện</Text>
      <EmptyState
        icon={VCTIcons.clipboard}
        title="Nội dung tập"
        message="Nội dung chi tiết buổi tập sẽ được HLV cập nhật tại đây."
      />
    </ScrollView>
  )
}
