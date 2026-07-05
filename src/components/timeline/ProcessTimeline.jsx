import Timeline from "@mui/lab/Timeline";
import TimelineItem from "@mui/lab/TimelineItem";
import TimelineSeparator from "@mui/lab/TimelineSeparator";
import TimelineConnector from "@mui/lab/TimelineConnector";
import TimelineContent from "@mui/lab/TimelineContent";
import TimelineDot from "@mui/lab/TimelineDot";
import TimelineOppositeContent from "@mui/lab/TimelineOppositeContent";

function ProcessTimeline({ steps = [] }) {
  return (
    <Timeline position="right">

      {steps.map((step, index) => (

        <TimelineItem key={index}>

          <TimelineOppositeContent color="text.secondary">
            {step.date}
          </TimelineOppositeContent>

          <TimelineSeparator>

            <TimelineDot
              color={
                step.status === "completed"
                  ? "success"
                  : step.status === "current"
                  ? "warning"
                  : "grey"
              }
              variant={
                step.status === "pending"
                  ? "outlined"
                  : "filled"
              }
            />

            {index < steps.length - 1 && <TimelineConnector />}

          </TimelineSeparator>

          <TimelineContent>
            {step.title}
          </TimelineContent>

        </TimelineItem>

      ))}

    </Timeline>
  );
}

export default ProcessTimeline;