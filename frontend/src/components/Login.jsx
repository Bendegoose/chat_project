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
        <div>
            <Container>
                <Row>
                    <Col xs="12" md="6" lg="5">
                        <Card>
                            <CardBody>
                                <CardTitle>
                                    Sign In
                                </CardTitle>

                                <Form onSubmit={handleLogin}>
                                    <FormGroup>
                                        <Label for="username">Username</Label>
                                        <Input id="username" type="text" autoComplete="username" onChange={onChange} required />
                                    </FormGroup>

                                    <FormGroup>
                                        <Label for="password">Password</Label>
                                        <Input id="password" type="password" autoComplete="current-password" onChange={onChange} required/>
                                    </FormGroup>

                                    {error && (
                                        <Alert>
                                            {error}
                                        </Alert>
                                    )}

                                    <Button>
                                        Sign In
                                    </Button>
                                </Form>
                                <div>
                                    <span onClick={() => navigate("/register")} style={{ cursor: "pointer", textDecoration: "underline" }}>
                                        Sign Up
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
