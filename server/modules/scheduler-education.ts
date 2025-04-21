export const schedulerEducationContent = `
# AI Scheduler for Automated Preventative Care

## Introduction to Smart Healthcare Scheduling

The AI Scheduler is a powerful tool that automatically monitors patient histories and recommends appropriate preventative care based on best practices and current guidelines. This feature helps ensure your patients receive timely reminders for vaccinations, screenings, and follow-up appointments without requiring manual tracking.

## Key Capabilities

### Automated Vaccination Scheduling
- Track and schedule essential vaccinations like Hepatitis B, HPV, and other age-appropriate immunizations
- Generate patient-specific recommendations based on medical history, age, and risk factors
- Send customizable reminder messages at optimal intervals

### Preventative Screening Coordination
- Schedule routine screenings based on patient demographics and risk factors
- Coordinate follow-up appointments for abnormal results
- Track screening compliance and generate reports for quality measures

### Follow-up Management
- Automatically schedule follow-up appointments for chronic conditions
- Create recurring appointment patterns based on condition severity and stability
- Generate smart reminders that include contextual information for both patients and providers

## Configuration Options

The AI Scheduler system is fully customizable through the settings interface:

1. **Category Selection**: Choose which categories of healthcare maintenance to automate (vaccinations, screenings, follow-ups, etc.)
2. **Patient Targeting**: Configure which patient populations should receive specific preventative recommendations
3. **Scheduling Rules**: Set frequency rules, age ranges, and gender specifications for each type of preventative care
4. **Message Templates**: Customize the content of automated reminder messages to match your practice's communication style

## Integration with Billing

The AI Scheduler is designed to optimize your practice's revenue cycle by:
- Identifying billable preventative services
- Tracking appropriate billing codes for each service
- Ensuring proper documentation for reimbursement
- Generating reports on preventative care revenue opportunities

## Getting Started

To begin using the AI Scheduler:
1. Navigate to the Scheduler section in the main navigation
2. Review the default settings for each preventative care category
3. Enable or disable specific preventative care items based on your practice needs
4. Customize message templates as desired
5. Monitor the "Upcoming Scheduled Events" section to track AI-generated appointments

## Best Practices

- Review AI scheduling suggestions regularly
- Customize age ranges and frequencies to match current clinical guidelines
- Update message templates to include your practice's contact information
- Schedule periodic reviews of preventative care compliance reports
`;

export const schedulerModuleMetadata = {
  title: "AI Scheduler for Preventative Care",
  description: "Learn how to configure and use the automated scheduling system for preventative care management.",
  type: "article",
  featuresUnlocked: ["Scheduler"],
  prerequisiteModules: [1], // Requires the base AI module
  order: 6, // Place after the existing modules
  estimatedMinutes: 20
};