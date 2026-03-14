import * as React from 'react'
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native'
import { useRouter } from 'solito/navigation'
import { useAuth } from '../../auth/AuthProvider'
import { Colors, SharedStyles, FontWeight, Radius, Space, Touch } from '../mobile-theme'
import { Badge, ScreenSkeleton } from '../mobile-ui'
import { Icon, VCTIcons } from '../icons'
import { hapticLight } from '../haptics'
import { useAthleteProfileMe } from '../useAthleteData'
import { EditProfileModal } from '../edit-profile-modal'

// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — Profile Screen (v3)
// Personal info focus — personal details, belt timeline, CLB info
// De-duplicated: no stats row, no quick nav (those are in Portal)
// ═══════════════════════════════════════════════════════════════

function InfoField({ icon, label, value }: {
  icon: React.ComponentProps<typeof Icon>['name']; label: string; value: string | undefined
}) {
  return (
    <View style={[SharedStyles.rowBetween, {
      paddingVertical: 12,
      borderBottomWidth: 1, borderBottomColor: Colors.border,
    }]} accessibilityLabel={`${label}: ${value || 'Chưa cập nhật'}`}>
      <View style={[SharedStyles.row, { gap: 10 }]}>
        <Icon name={icon} size={16} color={Colors.textSecondary} />
        <Text style={{ fontSize: 13, fontWeight: FontWeight.semibold, color: Colors.textSecondary }}>{label}</Text>
      </View>
      <Text style={{ fontSize: 13, fontWeight: FontWeight.bold, color: value ? Colors.textPrimary : Colors.textMuted }}>
        {value || 'Chưa cập nhật'}
      </Text>
    </View>
  )
}

export function ProfileMobileScreen() {
  const { currentUser } = useAuth()
  const router = useRouter()
  const { data, isLoading, refetch } = useAthleteProfileMe()
  const [editVisible, setEditVisible] = React.useState(false)

  if (isLoading || !data) return <ScreenSkeleton />

  return (
    <>
      <ScrollView
        style={SharedStyles.page}
        contentContainerStyle={SharedStyles.scrollContent}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={Colors.accent} />}
      >
        {/* HERO — with avatar */}
        <View style={SharedStyles.heroCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
            <View style={{
              width: 72, height: 72, borderRadius: 36,
              backgroundColor: Colors.overlay(Colors.accent, 0.2), justifyContent: 'center', alignItems: 'center',
              borderWidth: 2, borderColor: Colors.overlay(Colors.accent, 0.4),
            }}>
              <Icon name={VCTIcons.fitness} size={32} color={Colors.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 22, fontWeight: FontWeight.black, color: Colors.textWhite, marginBottom: 4 }}>
                {currentUser.name || data.name}
              </Text>
              <Text style={{ fontSize: 13, color: Colors.textMuted, fontWeight: FontWeight.semibold }}>
                Vận động viên · {data.club}
              </Text>
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                <Badge label={data.belt} bg={Colors.overlay(Colors.gold, 0.15)} fg={Colors.gold} icon={VCTIcons.ribbon} />
                {data.isActive && <Badge label="Đang hoạt động" bg={Colors.overlay(Colors.green, 0.15)} fg={Colors.green} icon={VCTIcons.checkmark} />}
              </View>
            </View>
          </View>
        </View>

        {/* EDIT PROFILE BUTTON */}
        <Pressable
          onPress={() => { hapticLight(); setEditVisible(true) }}
          accessibilityRole="button"
          accessibilityLabel="Chỉnh sửa hồ sơ"
          style={{
            flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
            borderRadius: Radius.md, padding: 14, marginBottom: Space.lg,
            backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border,
            minHeight: Touch.minSize,
          }}
        >
          <Icon name={VCTIcons.edit} size={18} color={Colors.accent} />
          <Text style={{ fontSize: 14, fontWeight: FontWeight.extrabold, color: Colors.accent }}>Chỉnh sửa hồ sơ</Text>
        </Pressable>

        {/* PERSONAL INFO */}
        <Text style={SharedStyles.sectionTitle}>Thông tin cá nhân</Text>
        <View style={SharedStyles.card}>
          <InfoField icon={VCTIcons.mail} label="Email" value={data.email || currentUser.email} />
          <InfoField icon={VCTIcons.phone} label="Điện thoại" value={data.phone} />
          <InfoField icon={VCTIcons.person} label="Giới tính" value={data.gender === 'male' ? 'Nam' : data.gender === 'female' ? 'Nữ' : data.gender} />
          <InfoField icon={VCTIcons.calendar} label="Ngày sinh" value={data.dateOfBirth} />
          <View style={[SharedStyles.rowBetween, { paddingVertical: 12 }]}
            accessibilityLabel={`CLB: ${data.club}`}>
            <View style={[SharedStyles.row, { gap: 10 }]}>
              <Icon name={VCTIcons.home} size={16} color={Colors.textSecondary} />
              <Text style={{ fontSize: 13, fontWeight: FontWeight.semibold, color: Colors.textSecondary }}>CLB</Text>
            </View>
            <Text style={{ fontSize: 13, fontWeight: FontWeight.bold, color: Colors.textPrimary }}>{data.club}</Text>
          </View>
        </View>

        {/* BELT TIMELINE — full */}
        <Text style={SharedStyles.sectionTitle}>Hành trình thăng đai</Text>
        <View style={SharedStyles.card}>
          {data.beltHistory.map((b, idx) => (
            <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: idx < data.beltHistory.length - 1 ? 14 : 0, position: 'relative' }}>
              {idx < data.beltHistory.length - 1 && (
                <View style={{ position: 'absolute', left: 5, top: 14, height: 26, width: 2, backgroundColor: Colors.border }} />
              )}
              <View style={{ width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: Colors.bgCard, backgroundColor: b.color }} />
              <View style={[SharedStyles.rowBetween, { flex: 1 }]}>
                <Text style={{ fontSize: 12, fontWeight: FontWeight.bold, color: Colors.textPrimary }}>{b.belt}</Text>
                <Text style={{ fontSize: 10, color: Colors.textSecondary, fontFamily: 'monospace' }}>{b.date}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* SKILL STATS — kept here as personal development */}
        <Text style={SharedStyles.sectionTitle}>Chỉ số phát triển</Text>
        <View style={SharedStyles.card}>
          {data.skills.map(sk => (
            <View key={sk.label} style={SharedStyles.skillRow} accessibilityLabel={`${sk.label}: ${sk.value} phần trăm`}>
              <Text style={SharedStyles.skillLabel}>{sk.label}</Text>
              <View style={SharedStyles.skillTrack}>
                <View style={[SharedStyles.skillFill, { width: `${sk.value}%`, backgroundColor: sk.color }]} />
              </View>
              <Text style={[{ width: 28, fontSize: 11, fontWeight: FontWeight.extrabold, textAlign: 'right' as const }, { color: sk.color }]}>{sk.value}</Text>
            </View>
          ))}
        </View>

        {/* GOALS */}
        <Text style={SharedStyles.sectionTitle}>Mục tiêu cá nhân</Text>
        <View style={SharedStyles.card}>
          {data.goals.map(g => (
            <View key={g.title} style={{ marginBottom: 14 }} accessibilityLabel={`${g.title}: ${g.progress}%`}>
              <View style={[SharedStyles.rowBetween, { marginBottom: 4 }]}>
                <View style={[SharedStyles.row, { gap: 8 }]}>
                  {g.icon && <Text style={{ fontSize: 14 }}>{g.icon}</Text>}
                  <Text style={{ fontSize: 12, fontWeight: FontWeight.bold, color: Colors.textPrimary }}>{g.title}</Text>
                </View>
                <Text style={{ fontSize: 11, fontWeight: FontWeight.extrabold, color: g.color }}>{g.progress}%</Text>
              </View>
              <View style={SharedStyles.progressTrack}>
                <View style={[SharedStyles.progressFill, { width: `${g.progress}%`, backgroundColor: g.color }]} />
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <EditProfileModal
        visible={editVisible}
        onClose={() => setEditVisible(false)}
        onSuccess={() => { setEditVisible(false); refetch() }}
        profile={data}
      />
    </>
  )
}
