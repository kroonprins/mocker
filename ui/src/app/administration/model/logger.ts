interface ParentLogger {
  level: string;
  initialLevel: string;
}

interface ChildLogger {
  id: string;
  level: string;
  initialLevel: string;
}

interface LogLevels {
  parent: ParentLogger;
  children: ChildLogger[];
}

export {
  LogLevels, ParentLogger, ChildLogger
 };

