import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    Form,
    FormGroup,
    Label,
    Input,
    Button,
    Alert,
    Container,
    Row,
    Col,
    Card,
    CardBody,
    CardTitle
} from "reactstrap";

export default function Login() {
    const [userData, setUserData] = useState({});
    const [error, setError] = useState(null);
    const { login, isAuthenticated, loading } = useAuth();
    const navigate = useNavigate();

    const onChange = (e) => setUserData({
        ...userData,
        [e.target.id]: e.target.value
    });

    async function handleLogin(e) {
        e.preventDefault();
        setError(null);

        try {
            await login(userData.username, userData.password);
            navigate('/');
        } catch (err) {
            setError(err.message);
        }
    }

    if (loading) return <p>Betöltés...</p>;
    if (isAuthenticated) return <Navigate to="/" replace />;

    return (
        <div className="min-vh-100 d-flex align-items-center bg-dark">
            <Container>
                <Row className="justify-content-center align-items-center">
                    <Col xs="12" md="6" lg="5">
                        <Card className="shadow-lg border-0 rounded-4">
                            <CardBody className="p-4">
                                <CardTitle tag="h4" className="text-center mb-4 fw-bold">
                                    Sign In
                                </CardTitle>

                                <Form onSubmit={handleLogin}>
                                    <FormGroup className="mb-3">
                                        <Label for="username">Username</Label>
                                        <Input id="username" type="text" autoComplete="username" onChange={onChange} required />
                                    </FormGroup>

                                    <FormGroup className="mb-3">
                                        <Label for="password">Password</Label>
                                        <Input id="password" type="password" autoComplete="current-password" onChange={onChange} required/>
                                    </FormGroup>

                                    {error && (
                                        <Alert color="danger" className="py-2">
                                            {error}
                                        </Alert>
                                    )}

                                    <Button color="primary" block className="w-100 mt-3">
                                        Sign In
                                    </Button>
                                </Form>
                                <div className="text-center mt-4">
                                    <span className="text-primary" onClick={() => navigate("/register")} style={{ cursor: "pointer", textDecoration: "underline" }}>
                                        Got an Invite Code?
                                    </span>
                                </div>
                            </CardBody>
                        </Card>
                    </Col>

                </Row>
            </Container>
        </div>
    );
}
