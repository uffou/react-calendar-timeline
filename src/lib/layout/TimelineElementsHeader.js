import PropTypes from 'prop-types'
import React, { Component } from 'react'
import moment from 'moment'

import { iterateTimes, getNextUnit } from '../utility/calendar'

function handleHeaderMouseDown({ nativeEvent: event }) {
  event.target.originalCoordinates = { x: event.clientX, y: event.clientY }
}

function checkCoordinates(event) {
  const xMatches = event.clientX === event.target.originalCoordinates.x
  const yMatches = event.clientY === event.target.originalCoordinates.y
  return xMatches && yMatches
}

export default class TimelineElementsHeader extends Component {
  static propTypes = {
    hasRightSidebar: PropTypes.bool.isRequired,
    showPeriod: PropTypes.func.isRequired,
    handleDayClick: PropTypes.func,
    dayLabelRenderer: PropTypes.func,
    canvasTimeStart: PropTypes.number.isRequired,
    canvasTimeEnd: PropTypes.number.isRequired,
    canvasWidth: PropTypes.number.isRequired,
    minUnit: PropTypes.string.isRequired,
    timeSteps: PropTypes.object.isRequired,
    width: PropTypes.number.isRequired,
    eventsByDay: PropTypes.object,
    headerLabelFormats: PropTypes.object.isRequired,
    subHeaderLabelFormats: PropTypes.object.isRequired,
    headerLabelGroupHeight: PropTypes.number.isRequired,
    headerLabelHeight: PropTypes.number.isRequired,
    scrollHeaderRef: PropTypes.func.isRequired
  }

  constructor(props) {
    super(props)

    this.state = {
      touchTarget: null,
      touchActive: false
    }
  }

  headerLabel(time, unit, width) {
    const { headerLabelFormats: f } = this.props

    if (unit === 'year') {
      return time.format(width < 46 ? f.yearShort : f.yearLong)
    } else if (unit === 'month') {
      return time.format(
        width < 65
          ? f.monthShort
          : width < 75
            ? f.monthMedium
            : width < 120 ? f.monthMediumLong : f.monthLong
      )
    } else if (unit === 'day') {
      return time.format(width < 150 ? f.dayShort : f.dayLong)
    } else if (unit === 'hour') {
      return time.format(
        width < 50
          ? f.hourShort
          : width < 130
            ? f.hourMedium
            : width < 150 ? f.hourMediumLong : f.hourLong
      )
    } else {
      return time.format(f.time)
    }
  }

  subHeaderLabel(time, unit, width, dayLabelRenderer, events) {
    const { subHeaderLabelFormats: f } = this.props

    if (unit === 'year') {
      return time.format(width < 46 ? f.yearShort : f.yearLong)
    } else if (unit === 'month') {
      return time.format(
        width < 37 ? f.monthShort : width < 85 ? f.monthMedium : f.monthLong
      )
    } else if (unit === 'day') {
      if(dayLabelRenderer) return dayLabelRenderer({time,unit,width,events})

      return time.format(
        width < 47
          ? f.dayShort
          : width < 80 ? f.dayMedium : width < 120 ? f.dayMediumLong : f.dayLong
      )
    } else if (unit === 'hour') {
      return time.format(width < 50 ? f.hourShort : f.hourLong)
    } else if (unit === 'minute') {
      return time.format(width < 60 ? f.minuteShort : f.minuteLong)
    } else {
      return time.get(unit)
    }
  }

  handlePeriodClick = (time, unit) => {
    if (time && unit) {
      const {handleDayClick, showPeriod} = this.props
      if(handleDayClick && unit === 'day'){
        handleDayClick(time)
      }else{
        showPeriod(moment(time - 0), unit)
      }
    }
  }

  shouldComponentUpdate(nextProps) {
    const willUpate =
      nextProps.canvasTimeStart != this.props.canvasTimeStart ||
      nextProps.canvasTimeEnd != this.props.canvasTimeEnd ||
      nextProps.width != this.props.width ||
      nextProps.canvasWidth != this.props.canvasWidth ||
      nextProps.subHeaderLabelFormats != this.props.subHeaderLabelFormats ||
      nextProps.headerLabelFormats != this.props.headerLabelFormats ||
      nextProps.hasRightSidebar != this.props.hasRightSidebar ||
      nextProps.eventsByDay != this.props.eventsByDay

    return willUpate
  }

  render() {
    const {
      canvasTimeStart,
      canvasTimeEnd,
      canvasWidth,
      minUnit,
      dayLabelRenderer,
      eventsByDay,
      timeSteps,
      headerLabelGroupHeight,
      headerLabelHeight,
      hasRightSidebar
    } = this.props

    const ratio = canvasWidth / (canvasTimeEnd - canvasTimeStart)
    const twoHeaders = minUnit !== 'year'

    const topHeaderLabels = []
    // add the top header
    if (twoHeaders) {
      const nextUnit = getNextUnit(minUnit)

      iterateTimes(
        canvasTimeStart,
        canvasTimeEnd,
        nextUnit,
        timeSteps,
        (time, nextTime) => {
          const left = Math.round((time.valueOf() - canvasTimeStart) * ratio)
          const right = Math.round(
            (nextTime.valueOf() - canvasTimeStart) * ratio
          )

          const labelWidth = right - left
          // this width applies to the content in the header
          // it simulates stickyness where the content is fixed in the center
          // of the label.  when the labelWidth is less than visible time range,
          // have label content fill the entire width
          const contentWidth = Math.min(labelWidth, canvasWidth)

          topHeaderLabels.push(
            <div
              key={`top-label-${time.valueOf()}`}
              className={`rct-label-group${
                hasRightSidebar ? ' rct-has-right-sidebar' : ''
              }`}
              onClick={(event) => (checkCoordinates(event.nativeEvent) && this.handlePeriodClick(time, nextUnit))}
              onMouseDown={handleHeaderMouseDown}
              style={{
                left: `${left - 1}px`,
                width: `${labelWidth}px`,
                height: `${headerLabelGroupHeight}px`,
                lineHeight: `${headerLabelGroupHeight}px`,
              }}
            >
              <span style={{ width: contentWidth, display: 'block' }}>
                {this.headerLabel(time, nextUnit, labelWidth)}
              </span>
            </div>
          )
        }
      )
    }

    const bottomHeaderLabels = []
    iterateTimes(
      canvasTimeStart,
      canvasTimeEnd,
      minUnit,
      timeSteps,
      (time, nextTime) => {
        const left = Math.round((time.valueOf() - canvasTimeStart) * ratio)
        const minUnitValue = time.get(minUnit === 'day' ? 'date' : minUnit)
        const firstOfType = minUnitValue === (minUnit === 'day' ? 1 : 0)
        const labelWidth = Math.round(
          (nextTime.valueOf() - time.valueOf()) * ratio
        )
        const leftCorrect = firstOfType ? 1 : 0

        const events = eventsByDay && eventsByDay[time.format('YYYYMMDD')]

        bottomHeaderLabels.push(
          <div
            key={`label-${time.valueOf()}`}
            className={`rct-label ${twoHeaders ? '' : 'rct-label-only'} ${
              firstOfType ? 'rct-first-of-type' : ''
            } ${minUnit !== 'month' ? `rct-day-${time.day()}` : ''} `}
            onClick={(event) => (checkCoordinates(event.nativeEvent) && this.handlePeriodClick(time, minUnit))}
            onMouseDown={handleHeaderMouseDown}
            style={{
              left: `${left - leftCorrect}px`,
              width: `${labelWidth}px`,
              height: `${
                minUnit === 'year'
                  ? headerLabelGroupHeight + headerLabelHeight
                  : headerLabelHeight
              }px`,
              lineHeight: `${
                minUnit === 'year'
                  ? headerLabelGroupHeight + headerLabelHeight
                  : headerLabelHeight
              }px`,
              fontSize: `${
                labelWidth > 30 ? '14' : labelWidth > 20 ? '12' : '10'
              }px`,
            }}
          >
            {this.subHeaderLabel(time, minUnit, labelWidth,dayLabelRenderer, events)}
          </div>
        )
      }
    )

    let headerStyle = {
      height: `${headerLabelGroupHeight + headerLabelHeight}px`
    }

    return (
      <div
        key="header"
        data-testid="header"
        className="rct-header"
        onTouchStart={this.touchStart}
        onTouchEnd={this.touchEnd}
        style={headerStyle}
        ref={this.props.scrollHeaderRef}
      >
        <div
          className="rct-top-header"
          style={{ height: twoHeaders ? headerLabelGroupHeight : 0, width: canvasWidth }}
        >
          {topHeaderLabels}
        </div>
        <div
          className="rct-bottom-header"
          style={{ height: headerLabelHeight, width: canvasWidth }}
        >
          {bottomHeaderLabels}
        </div>
      </div>
    )
  }
}
